from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectConfig(BaseModel):
    formality: str = "neutral"
    domain: str | None = None
    skip_clarify: bool = False
    chunk_strategy: str = "auto"
    max_chunk_tokens: int = 2000


class CreateProjectRequest(BaseModel):
    title: str = Field(max_length=255)
    target_language: str = Field(max_length=10)
    source_language: str | None = Field(None, max_length=10)
    config: ProjectConfig = Field(default_factory=ProjectConfig)


class UpdateProjectRequest(BaseModel):
    title: str | None = Field(None, max_length=255)
    config: ProjectConfig | None = None


class ProjectResponse(BaseModel):
    id: UUID
    title: str
    source_language: str | None
    target_language: str
    status: str
    config: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
