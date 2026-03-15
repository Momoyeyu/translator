from pipeline.events import (
    ArtifactCreatedData,
    ChunkPlannedData,
    ChunkTranslatedData,
    ChunkTranslatingData,
    LLMThinkingData,
    PipelineEventType,
    StageData,
    TermExtractedData,
    ToolCallData,
    ToolResultData,
    UnifyResultData,
)


def test_event_types():
    assert PipelineEventType.STAGE_STARTED == "stage_started"
    assert PipelineEventType.CHUNK_TRANSLATED == "chunk_translated"
    assert PipelineEventType.CHUNK_TRANSLATING == "chunk_translating"
    assert PipelineEventType.TOOL_CALL == "tool_call"
    assert PipelineEventType.TOOL_RESULT == "tool_result"
    assert PipelineEventType.TERMS_FOUND == "terms_found"
    assert PipelineEventType.TERM_UNCERTAIN == "term_uncertain"
    assert PipelineEventType.TERMS_AUTO_CONFIRMED == "terms_auto_confirmed"
    assert PipelineEventType.UNIFY_RESULT == "unify_result"
    assert PipelineEventType.PIPELINE_COMPLETED == "pipeline_completed"
    assert PipelineEventType.PIPELINE_FAILED == "pipeline_failed"
    assert PipelineEventType.CLARIFY_REQUEST == "clarify_request"
    assert PipelineEventType.PIPELINE_STAGE_STARTED == "pipeline_stage_started"
    assert len(PipelineEventType) == 19


def test_stage_data():
    d = StageData(stage="plan", message="Starting plan")
    assert d.stage == "plan"


def test_chunk_planned_data():
    d = ChunkPlannedData(chunk_index=0, source_preview="Hello")
    assert d.chunk_index == 0


def test_term_extracted_data():
    d = TermExtractedData(source_term="ML", translated_term="机器学习", confidence=0.3)
    assert d.confidence == 0.3


def test_tool_call_data():
    d = ToolCallData(tool="web_search", input={"query": "test"})
    assert d.tool == "web_search"


def test_tool_result_data():
    d = ToolResultData(tool="web_search", query="test query", results_count=3, preview="result preview")
    assert d.results_count == 3


def test_chunk_translating_data():
    d = ChunkTranslatingData(chunk_index=0, total_chunks=5, source_preview="Hello world")
    assert d.total_chunks == 5


def test_chunk_translated_data():
    d = ChunkTranslatedData(chunk_index=1, total_chunks=5, source_text="Hello", translated_text="你好")
    assert d.translated_text == "你好"


def test_llm_thinking_data():
    d = LLMThinkingData(message="Analyzing context...", stage="translate")
    assert d.stage == "translate"


def test_unify_result_data():
    d = UnifyResultData(preview="Final document preview...", total_length=5000)
    assert d.total_length == 5000


def test_artifact_data():
    d = ArtifactCreatedData(artifact_id="123", format="markdown", file_size=1024, title="My Translation")
    assert d.format == "markdown"
    assert d.title == "My Translation"
