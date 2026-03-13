from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class PipelineTaskResponse(BaseModel):
    id: UUID
    stage: str
    status: str
    result: dict | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
