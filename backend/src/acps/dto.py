"""ACPs JSON-RPC 2.0 request/response schemas and AIP task state types."""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class TaskState(StrEnum):
    """AIP task lifecycle states."""

    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    WORKING = "working"
    INPUT_REQUIRED = "input-required"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class TaskCommand(StrEnum):
    """AIP task commands."""

    START = "start"
    GET = "get"
    CONTINUE = "continue"
    CANCEL = "cancel"
    COMPLETE = "complete"


class JsonRpcError(BaseModel):
    """JSON-RPC 2.0 error object."""

    code: int
    message: str
    data: Any = None


class JsonRpcRequest(BaseModel):
    """JSON-RPC 2.0 request."""

    jsonrpc: str = "2.0"
    id: str | int | None = None
    method: str = "rpc"
    params: dict[str, Any] = {}


class JsonRpcResponse(BaseModel):
    """JSON-RPC 2.0 response."""

    jsonrpc: str = "2.0"
    id: str | int | None = None
    result: dict[str, Any] | None = None
    error: JsonRpcError | None = None


class TaskResult(BaseModel):
    """AIP task result wrapped in JSON-RPC response."""

    taskId: str
    state: TaskState
    message: str | None = None
    artifacts: list[dict[str, Any]] = []
