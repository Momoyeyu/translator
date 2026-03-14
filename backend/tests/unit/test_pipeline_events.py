from pipeline.events import (
    ArtifactCreatedData,
    ChunkPlannedData,
    ChunkTranslatedData,
    LLMThinkingData,
    PipelineEventType,
    StageData,
    TermExtractedData,
    ToolCallData,
)


def test_event_types():
    assert PipelineEventType.STAGE_STARTED == "stage_started"
    assert PipelineEventType.CHUNK_TRANSLATED == "chunk_translated"
    assert len(PipelineEventType) == 13


def test_stage_data():
    d = StageData(stage="plan", message="Starting plan")
    assert d.stage == "plan"


def test_chunk_planned_data():
    d = ChunkPlannedData(chunk_index=0, source_text="Hello")
    assert d.chunk_index == 0


def test_term_extracted_data():
    d = TermExtractedData(source_term="ML", translated_term="机器学习", confidence=0.3)
    assert d.confidence == 0.3


def test_tool_call_data():
    d = ToolCallData(tool_name="web_search", tool_input={"query": "test"})
    assert d.tool_name == "web_search"


def test_chunk_translated_data():
    d = ChunkTranslatedData(chunk_index=1, translated_text="你好")
    assert d.translated_text == "你好"


def test_llm_thinking_data():
    d = LLMThinkingData(content="Analyzing context...", stage="translate")
    assert d.stage == "translate"


def test_artifact_data():
    d = ArtifactCreatedData(artifact_id="123", format="markdown", file_size=1024)
    assert d.format == "markdown"
