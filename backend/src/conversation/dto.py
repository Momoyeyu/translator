from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class MessageResponse(BaseModel):
    id: UUID
    role: str
    type: str
    content: str
    detail: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
