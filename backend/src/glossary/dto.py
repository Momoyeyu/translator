from uuid import UUID

from pydantic import BaseModel, Field


class GlossaryTermResponse(BaseModel):
    id: UUID
    source_term: str
    translated_term: str
    confirmed: bool
    context: str | None

    model_config = {"from_attributes": True}


class UpdateGlossaryTermRequest(BaseModel):
    translated_term: str = Field(max_length=255)
