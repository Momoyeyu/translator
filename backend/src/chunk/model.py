from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ChunkStatus(StrEnum):
    PENDING = "pending"
    TRANSLATING = "translating"
    COMPLETED = "completed"
    FAILED = "failed"


class Chunk(Base):
    __tablename__ = "chunk"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("translation_project.id"))
    document_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("document.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    source_text: Mapped[str] = mapped_column(Text)
    translated_text: Mapped[str | None] = mapped_column(Text, default=None)
    status: Mapped[str] = mapped_column(String(20), default=ChunkStatus.PENDING)
    token_count: Mapped[int | None] = mapped_column(Integer, default=None)
    chunk_metadata: Mapped[dict | None] = mapped_column(JSONB, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


async def get_chunks_by_project(project_id: UUID) -> list[Chunk]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Chunk).where(Chunk.project_id == project_id).order_by(Chunk.chunk_index)
        )
        return list(result.scalars().all())
