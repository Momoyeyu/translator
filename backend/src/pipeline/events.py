"""Pipeline event type definitions with Pydantic payload models."""
from enum import StrEnum

from pydantic import BaseModel


class PipelineEventType(StrEnum):
    STAGE_STARTED = "stage_started"
    STAGE_COMPLETED = "stage_completed"
    STAGE_FAILED = "stage_failed"
    LLM_THINKING = "llm_thinking"
    TOOL_CALL_START = "tool_call_start"
    TOOL_CALL_RESULT = "tool_call_result"
    CHUNK_PLANNED = "chunk_planned"
    TERM_EXTRACTED = "term_extracted"
    TERMS_AWAITING = "terms_awaiting"
    CHUNK_TRANSLATED = "chunk_translated"
    CHUNK_STREAMING = "chunk_streaming"
    UNIFY_COMPLETE = "unify_complete"
    ARTIFACT_CREATED = "artifact_created"


class StageData(BaseModel):
    stage: str
    message: str | None = None


class ChunkPlannedData(BaseModel):
    chunk_index: int
    source_text: str
    token_count: int | None = None
    metadata: dict | None = None


class TermExtractedData(BaseModel):
    term_id: str | None = None
    source_term: str
    translated_term: str
    confidence: float = 0.5
    context: str | None = None


class ToolCallData(BaseModel):
    tool_name: str
    tool_input: dict = {}
    result: str | None = None
    duration_ms: int | None = None


class ChunkTranslatedData(BaseModel):
    chunk_index: int
    translated_text: str


class ChunkStreamingData(BaseModel):
    chunk_index: int
    delta: str


class LLMThinkingData(BaseModel):
    content: str
    stage: str


class ArtifactCreatedData(BaseModel):
    artifact_id: str
    format: str
    file_size: int
