"""Unit tests for acps.service — AIP task command handlers."""

import pytest

from acps.dto import TaskState
from acps.service import _tasks, handle_command


@pytest.fixture(autouse=True)
def _clear_tasks():
    """Reset in-memory task store between tests."""
    _tasks.clear()
    yield
    _tasks.clear()


@pytest.mark.asyncio
async def test_start_creates_task():
    result = await handle_command("start", {
        "command": {
            "command": "start",
            "skillId": "translator.text",
            "data": {
                "items": [{"mimeType": "text/plain", "data": "Hello"}],
                "metadata": {"targetLanguage": "zh"},
            },
        },
    })
    assert result.state == TaskState.ACCEPTED
    assert result.taskId in _tasks
    assert _tasks[result.taskId]["target_language"] == "zh"


@pytest.mark.asyncio
async def test_start_defaults_to_zh():
    result = await handle_command("start", {
        "command": {
            "command": "start",
            "data": {"items": [], "metadata": {}},
        },
    })
    assert result.state == TaskState.ACCEPTED
    assert _tasks[result.taskId]["target_language"] == "zh"


@pytest.mark.asyncio
async def test_get_returns_task_state():
    # Create a task first
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    result = await handle_command("get", {
        "command": {"command": "get", "taskId": task_id},
    })
    assert result.state == TaskState.ACCEPTED
    assert result.taskId == task_id


@pytest.mark.asyncio
async def test_get_missing_task_fails():
    result = await handle_command("get", {
        "command": {"command": "get", "taskId": "nonexistent"},
    })
    assert result.state == TaskState.FAILED
    assert "not found" in result.message.lower()


@pytest.mark.asyncio
async def test_cancel_sets_canceled_state():
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    result = await handle_command("cancel", {
        "command": {"command": "cancel", "taskId": task_id},
    })
    assert result.state == TaskState.CANCELED
    assert _tasks[task_id]["state"] == TaskState.CANCELED


@pytest.mark.asyncio
async def test_continue_requires_input_required_state():
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    # Task is in ACCEPTED state, not INPUT_REQUIRED
    result = await handle_command("continue", {
        "command": {"command": "continue", "taskId": task_id, "data": {}},
    })
    assert result.state == TaskState.ACCEPTED
    assert "not awaiting input" in result.message.lower()


@pytest.mark.asyncio
async def test_continue_from_input_required():
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    # Manually set state to input-required
    _tasks[task_id]["state"] = TaskState.INPUT_REQUIRED

    result = await handle_command("continue", {
        "command": {"command": "continue", "taskId": task_id, "data": {"glossary": {}}},
    })
    assert result.state == TaskState.WORKING


@pytest.mark.asyncio
async def test_complete_requires_completed_state():
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    # Task is ACCEPTED, not COMPLETED
    result = await handle_command("complete", {
        "command": {"command": "complete", "taskId": task_id},
    })
    assert result.state == TaskState.ACCEPTED
    assert "not in completed state" in result.message.lower()


@pytest.mark.asyncio
async def test_complete_acknowledges_completed_task():
    start = await handle_command("start", {
        "command": {"command": "start", "data": {"items": [], "metadata": {}}},
    })
    task_id = start.taskId

    _tasks[task_id]["state"] = TaskState.COMPLETED
    _tasks[task_id]["artifacts"] = [{"mimeType": "text/markdown", "data": "Translated"}]

    result = await handle_command("complete", {
        "command": {"command": "complete", "taskId": task_id},
    })
    assert result.state == TaskState.COMPLETED
    assert len(result.artifacts) == 1


@pytest.mark.asyncio
async def test_unknown_command():
    result = await handle_command("bogus", {
        "command": {"command": "bogus"},
    })
    assert result.state == TaskState.FAILED
    assert "unknown" in result.message.lower()
