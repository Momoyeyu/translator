"""Unit tests for acps.handler — JSON-RPC 2.0 endpoint validation."""

import json
from unittest.mock import MagicMock, patch

from acps.dto import TaskResult, TaskState
from acps.handler import _check_mock_auth, _rpc_error, _rpc_result

# ── Helper function tests ───────────────────────────────────────────────


def test_rpc_error_structure():
    resp = _rpc_error("req-1", -32600, "Invalid Request")
    body = json.loads(resp.body)
    assert body["jsonrpc"] == "2.0"
    assert body["id"] == "req-1"
    assert body["error"]["code"] == -32600
    assert body["error"]["message"] == "Invalid Request"


def test_rpc_result_structure():
    resp = _rpc_result("req-2", {"taskId": "t1", "state": "accepted"})
    body = json.loads(resp.body)
    assert body["jsonrpc"] == "2.0"
    assert body["id"] == "req-2"
    assert body["result"]["taskId"] == "t1"


def test_rpc_error_null_id():
    resp = _rpc_error(None, -32700, "Parse error")
    body = json.loads(resp.body)
    assert body["id"] is None


# ── Mock auth tests ─────────────────────────────────────────────────────


def test_mock_auth_skips_when_enabled():
    """When acps_mock_auth=True, _check_mock_auth returns None (pass)."""
    request = MagicMock()
    with patch("acps.handler.settings") as mock_settings:
        mock_settings.acps_mock_auth = True
        result = _check_mock_auth(request)
    assert result is None


def test_mock_auth_rejects_without_cert():
    """When acps_mock_auth=False and no cert header, return error."""
    request = MagicMock()
    request.headers.get.return_value = None
    with patch("acps.handler.settings") as mock_settings:
        mock_settings.acps_mock_auth = False
        result = _check_mock_auth(request)
    assert result is not None
    body = json.loads(result.body)
    assert body["error"]["code"] == -32600


def test_mock_auth_accepts_valid_cert():
    """When acps_mock_auth=False and cert is verified, return None."""
    request = MagicMock()
    request.headers.get.return_value = "SUCCESS"
    with patch("acps.handler.settings") as mock_settings:
        mock_settings.acps_mock_auth = False
        result = _check_mock_auth(request)
    assert result is None


# ── DTO tests ────────────────────────────────────────────────────────────


def test_task_result_serialization():
    result = TaskResult(
        taskId="t-1",
        state=TaskState.ACCEPTED,
        message="ok",
        artifacts=[],
    )
    d = result.model_dump()
    assert d["taskId"] == "t-1"
    assert d["state"] == "accepted"
    assert d["artifacts"] == []


def test_task_result_with_artifacts():
    result = TaskResult(
        taskId="t-2",
        state=TaskState.COMPLETED,
        artifacts=[{"mimeType": "text/markdown", "data": "hello"}],
    )
    assert len(result.artifacts) == 1
