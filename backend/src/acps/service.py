"""ACPs service layer — maps AIP task commands to internal pipeline operations."""

from __future__ import annotations

from typing import Any

from loguru import logger
from uuid6 import uuid7

from acps.dto import TaskCommand, TaskResult, TaskState

# In-memory task registry for v1 (replace with DB-backed store later)
_tasks: dict[str, dict[str, Any]] = {}


async def handle_command(command_type: str, params: dict[str, Any]) -> TaskResult:
    """Route an AIP command to the appropriate handler."""
    handlers = {
        TaskCommand.START: handle_start,
        TaskCommand.GET: handle_get,
        TaskCommand.CONTINUE: handle_continue,
        TaskCommand.CANCEL: handle_cancel,
        TaskCommand.COMPLETE: handle_complete,
    }
    handler = handlers.get(command_type)
    if not handler:
        return TaskResult(
            taskId=params.get("taskId", "unknown"),
            state=TaskState.FAILED,
            message=f"Unknown command: {command_type}",
        )
    return await handler(params)


async def handle_start(params: dict[str, Any]) -> TaskResult:
    """Create a translation task from AIP start command.

    Expected params.command.data:
      - items: list of {mimeType, data} to translate
      - metadata: {targetLanguage, sourceLanguage?, ...}
    """
    command = params.get("command", {})
    data = command.get("data", {})
    items = data.get("items", [])
    metadata = data.get("metadata", {})

    task_id = str(uuid7())
    target_language = metadata.get("targetLanguage", "zh")
    source_language = metadata.get("sourceLanguage")
    skill_id = command.get("skillId", "translator.text")

    _tasks[task_id] = {
        "state": TaskState.ACCEPTED,
        "items": items,
        "metadata": metadata,
        "skill_id": skill_id,
        "target_language": target_language,
        "source_language": source_language,
        "project_id": None,
    }

    logger.info(f"ACPs task started: {task_id}, skill={skill_id}, target={target_language}")

    return TaskResult(
        taskId=task_id,
        state=TaskState.ACCEPTED,
        message=f"Translation task accepted (skill: {skill_id})",
    )


async def handle_get(params: dict[str, Any]) -> TaskResult:
    """Return current status of a task."""
    command = params.get("command", {})
    task_id = command.get("taskId", params.get("taskId"))

    if not task_id or task_id not in _tasks:
        return TaskResult(
            taskId=task_id or "unknown",
            state=TaskState.FAILED,
            message="Task not found",
        )

    task = _tasks[task_id]
    return TaskResult(
        taskId=task_id,
        state=TaskState(task["state"]),
        message=f"Task is in {task['state']} state",
        artifacts=task.get("artifacts", []),
    )


async def handle_continue(params: dict[str, Any]) -> TaskResult:
    """Handle continue command — e.g., confirm glossary terms during clarify phase."""
    command = params.get("command", {})
    task_id = command.get("taskId", params.get("taskId"))

    if not task_id or task_id not in _tasks:
        return TaskResult(
            taskId=task_id or "unknown",
            state=TaskState.FAILED,
            message="Task not found",
        )

    task = _tasks[task_id]
    if task["state"] != TaskState.INPUT_REQUIRED:
        return TaskResult(
            taskId=task_id,
            state=TaskState(task["state"]),
            message="Task is not awaiting input",
        )

    # Accept the user's input and resume processing
    data = command.get("data", {})
    task["continue_data"] = data
    task["state"] = TaskState.WORKING

    logger.info(f"ACPs task continued: {task_id}")

    return TaskResult(
        taskId=task_id,
        state=TaskState.WORKING,
        message="Glossary confirmed, translation resuming",
    )


async def handle_cancel(params: dict[str, Any]) -> TaskResult:
    """Cancel a running task."""
    command = params.get("command", {})
    task_id = command.get("taskId", params.get("taskId"))

    if not task_id or task_id not in _tasks:
        return TaskResult(
            taskId=task_id or "unknown",
            state=TaskState.FAILED,
            message="Task not found",
        )

    task = _tasks[task_id]
    task["state"] = TaskState.CANCELED

    logger.info(f"ACPs task cancelled: {task_id}")

    return TaskResult(
        taskId=task_id,
        state=TaskState.CANCELED,
        message="Task cancelled",
    )


async def handle_complete(params: dict[str, Any]) -> TaskResult:
    """Acknowledge task completion."""
    command = params.get("command", {})
    task_id = command.get("taskId", params.get("taskId"))

    if not task_id or task_id not in _tasks:
        return TaskResult(
            taskId=task_id or "unknown",
            state=TaskState.FAILED,
            message="Task not found",
        )

    task = _tasks[task_id]
    if task["state"] != TaskState.COMPLETED:
        return TaskResult(
            taskId=task_id,
            state=TaskState(task["state"]),
            message="Task is not in completed state",
        )

    logger.info(f"ACPs task completion acknowledged: {task_id}")

    return TaskResult(
        taskId=task_id,
        state=TaskState.COMPLETED,
        message="Task completion acknowledged",
        artifacts=task.get("artifacts", []),
    )
