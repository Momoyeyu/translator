from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Uuid, select
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ArtifactFormat(StrEnum):
    MARKDOWN = "markdown"
    PDF = "pdf"


class Artifact(Base):
    __tablename__ = "artifact"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("translation_project.id"), index=True)
    document_id: Mapped[UUID | None] = mapped_column(Uuid, ForeignKey("document.id"), default=None)
    title: Mapped[str] = mapped_column(String(255))
    format: Mapped[str] = mapped_column(String(20))
    storage_key: Mapped[str] = mapped_column(String(512))
    file_size: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


async def get_artifacts_by_project(project_id: UUID) -> list[Artifact]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Artifact).where(Artifact.project_id == project_id)
        )
        return list(result.scalars().all())
