"""Pipeline event type definitions with Pydantic payload models."""
from enum import StrEnum

from pydantic import BaseModel


class PipelineEventType(StrEnum):
    STAGE_STARTED = "stage_started"
    STAGE_COMPLETED = "stage_completed"
    STAGE_FAILED = "stage_failed"
    LLM_THINKING = "llm_thinking"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    CHUNK_PLANNED = "chunk_planned"
    TERMS_FOUND = "terms_found"
    TERM_UNCERTAIN = "term_uncertain"
    TERMS_AUTO_CONFIRMED = "terms_auto_confirmed"
    TERMS_EXTRACTED = "terms_extracted"
    CHUNK_TRANSLATING = "chunk_translating"
    CHUNK_TRANSLATED = "chunk_translated"
    UNIFY_RESULT = "unify_result"
    ARTIFACT_CREATED = "artifact_created"
    PIPELINE_COMPLETED = "pipeline_completed"
    PIPELINE_FAILED = "pipeline_failed"


class StageData(BaseModel):
    stage: str
    message: str | None = None


class ChunkPlannedData(BaseModel):
    chunk_index: int
    source_preview: str
    token_count: int | None = None


class TermExtractedData(BaseModel):
    source_term: str
    translated_term: str
    confidence: float = 0.5
    context: str | None = None


class ToolCallData(BaseModel):
    tool: str
    input: dict = {}
    status: str = "calling"


class ToolResultData(BaseModel):
    tool: str
    query: str
    results_count: int = 0
    preview: str = ""


class ChunkTranslatingData(BaseModel):
    chunk_index: int
    total_chunks: int
    source_preview: str


class ChunkTranslatedData(BaseModel):
    chunk_index: int
    total_chunks: int
    source_text: str
    translated_text: str


class LLMThinkingData(BaseModel):
    message: str
    stage: str | None = None


class UnifyResultData(BaseModel):
    preview: str
    total_length: int


class ArtifactCreatedData(BaseModel):
    artifact_id: str
    format: str
    file_size: int
    title: str | None = None
