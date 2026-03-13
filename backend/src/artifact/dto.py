from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ArtifactResponse(BaseModel):
    id: UUID
    title: str
    format: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}
