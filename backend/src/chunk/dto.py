from uuid import UUID

from pydantic import BaseModel


class ChunkResponse(BaseModel):
    id: UUID
    chunk_index: int
    source_text: str
    translated_text: str | None
    status: str
    token_count: int | None
    chunk_metadata: dict | None

    model_config = {"from_attributes": True}
