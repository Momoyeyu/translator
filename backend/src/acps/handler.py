"""ACPs AIP JSON-RPC 2.0 handler and ACS well-known endpoint."""

from __future__ import annotations

import os

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, JSONResponse
from loguru import logger

from acps import service
from conf.config import settings
from middleware.auth import exempt

router = APIRouter(tags=["acps"])

# ── JSON-RPC 2.0 error codes ────────────────────────────────────────────
_PARSE_ERROR = -32700
_INVALID_REQUEST = -32600
_METHOD_NOT_FOUND = -32601
_INTERNAL_ERROR = -32603


def _rpc_error(req_id: str | int | None, code: int, message: str) -> JSONResponse:
    """Build a JSON-RPC 2.0 error response."""
    return JSONResponse({
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": code, "message": message},
    })


def _rpc_result(req_id: str | int | None, result: dict) -> JSONResponse:
    """Build a JSON-RPC 2.0 success response."""
    return JSONResponse({
        "jsonrpc": "2.0",
        "id": req_id,
        "result": result,
    })


def _check_mock_auth(request: Request) -> JSONResponse | None:
    """Validate mTLS client certificate.

    When ``settings.acps_mock_auth`` is ``True`` (default for dev), skip
    certificate verification entirely.  Otherwise, check for the
    ``X-SSL-Client-Verify`` header set by a TLS-terminating proxy.
    """
    if settings.acps_mock_auth:
        return None

    client_verified = request.headers.get("X-SSL-Client-Verify")
    if client_verified != "SUCCESS":
        return _rpc_error(
            None,
            _INVALID_REQUEST,
            "mTLS client certificate required",
        )
    return None


@router.post("/acps/rpc")
@exempt
async def acps_rpc(request: Request) -> JSONResponse:
    """AIP JSON-RPC 2.0 endpoint.

    Accepts ``method: "rpc"`` with ``params.command`` containing an AIP
    TaskCommand (start / get / continue / cancel / complete).
    """
    # ── mTLS auth check ──────────────────────────────────────────────
    auth_err = _check_mock_auth(request)
    if auth_err is not None:
        return auth_err

    # ── Parse request body ───────────────────────────────────────────
    try:
        body = await request.json()
    except Exception:
        return _rpc_error(None, _PARSE_ERROR, "Parse error")

    req_id = body.get("id")

    # ── Validate JSON-RPC 2.0 envelope ───────────────────────────────
    if body.get("jsonrpc") != "2.0":
        return _rpc_error(req_id, _INVALID_REQUEST, "Invalid Request: missing jsonrpc 2.0")

    if body.get("method") != "rpc":
        return _rpc_error(req_id, _METHOD_NOT_FOUND, f"Method not found: {body.get('method')}")

    # ── Extract command ──────────────────────────────────────────────
    params = body.get("params", {})
    command = params.get("command", {})
    command_type = command.get("command")

    if not command_type:
        return _rpc_error(req_id, _INVALID_REQUEST, "Missing params.command.command")

    # ── Dispatch to service layer ────────────────────────────────────
    logger.info(f"ACPs RPC: command={command_type}, id={req_id}")
    try:
        result = await service.handle_command(command_type, params)
        return _rpc_result(req_id, result.model_dump())
    except Exception as e:
        logger.exception(f"ACPs RPC internal error: {e}")
        return _rpc_error(req_id, _INTERNAL_ERROR, "Internal error")


@router.get("/.well-known/acs.json")
@exempt
async def get_acs() -> FileResponse:
    """Serve the ACS capability specification."""
    acs_path = os.path.join(os.path.dirname(__file__), "acs.json")
    return FileResponse(acs_path, media_type="application/json")
