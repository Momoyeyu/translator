from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: UUID
    project_id: UUID
    file_name: str
    mime_type: str
    file_size: int
    created_at: datetime

    model_config = {"from_attributes": True}
