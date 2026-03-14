from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PipelineEventResponse(BaseModel):
    id: UUID
    stage: str
    event_type: str
    sequence: int
    data: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
