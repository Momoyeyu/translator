"""Unit tests for the PipelineExecutor (worker.pipeline_executor).

Tests focus on constructor logic and attributes that can be verified
without running a full Kafka + DB stack.
"""

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from llm.service import LLMService
from worker.pipeline_executor import PipelineExecutor, _parse_llm_json


@pytest.fixture
def mock_llm():
    llm = MagicMock(spec=LLMService)
    llm.chat = AsyncMock(
        return_value='[{"chunk_index": 0, "source_text": "Hello", "metadata": {}}]'
    )
    return llm


def test_pipeline_executor_init(mock_llm):
    """PipelineExecutor should initialize with correct topic and concurrency."""
    executor = PipelineExecutor(mock_llm)
    assert executor.topic == "translator.pipeline"
    assert executor.max_concurrency == 3
    assert executor.llm is mock_llm


def test_pipeline_executor_inherits_base_worker(mock_llm):
    """PipelineExecutor must be a BaseWorker subclass."""
    from worker.base import BaseWorker

    executor = PipelineExecutor(mock_llm)
    assert isinstance(executor, BaseWorker)


def test_pipeline_executor_has_handle_message(mock_llm):
    """PipelineExecutor must implement handle_message."""
    executor = PipelineExecutor(mock_llm)
    assert callable(getattr(executor, "handle_message", None))


def test_pipeline_executor_has_stage_methods(mock_llm):
    """PipelineExecutor should have private methods for each stage."""
    executor = PipelineExecutor(mock_llm)
    for method_name in ["_execute_plan", "_execute_clarify", "_execute_translate", "_execute_unify"]:
        assert callable(getattr(executor, method_name, None)), f"Missing method: {method_name}"


def test_pipeline_executor_has_task_lifecycle_methods(mock_llm):
    """PipelineExecutor should have _complete_task, _fail_task, _advance_stage."""
    executor = PipelineExecutor(mock_llm)
    for method_name in ["_complete_task", "_fail_task", "_advance_stage"]:
        assert callable(getattr(executor, method_name, None)), f"Missing method: {method_name}"


def test_pipeline_executor_semaphore(mock_llm):
    """Semaphore should match max_concurrency."""
    executor = PipelineExecutor(mock_llm)
    assert executor._semaphore._value == 3


def test_pipeline_executor_not_running_initially(mock_llm):
    """Executor should not be running before start() is called."""
    executor = PipelineExecutor(mock_llm)
    assert executor._running is False


def test_pipeline_executor_consumer_none_initially(mock_llm):
    """Consumer should be None before start() is called."""
    executor = PipelineExecutor(mock_llm)
    assert executor._consumer is None


# --- _parse_llm_json tests ---


def test_parse_llm_json_strips_json_code_block():
    """Should strip ```json ... ``` wrappers before parsing."""
    result = _parse_llm_json('```json\n[{"key": "value"}]\n```')
    assert result == [{"key": "value"}]


def test_parse_llm_json_strips_plain_code_block():
    """Should strip ``` ... ``` wrappers (no language tag) before parsing."""
    result = _parse_llm_json('```\n{"key": "value"}\n```')
    assert result == {"key": "value"}


def test_parse_llm_json_plain_json():
    """Should parse plain JSON without any wrapper."""
    result = _parse_llm_json('[{"key": "value"}]')
    assert result == [{"key": "value"}]


def test_parse_llm_json_with_surrounding_whitespace():
    """Should handle leading/trailing whitespace around code blocks."""
    result = _parse_llm_json('  \n```json\n[1, 2, 3]\n```\n  ')
    assert result == [1, 2, 3]


def test_parse_llm_json_raises_on_invalid_json():
    """Should raise on content that is not valid JSON even after stripping."""
    with pytest.raises((json.JSONDecodeError, ValueError)):
        _parse_llm_json('```json\nnot valid json\n```')
