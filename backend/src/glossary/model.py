from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Uuid, select
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class GlossaryTerm(Base):
    __tablename__ = "glossary_term"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("translation_project.id"), index=True)
    source_term: Mapped[str] = mapped_column(String(255))
    translated_term: Mapped[str] = mapped_column(String(255))
    confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    context: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


async def get_glossary_by_project(project_id: UUID) -> list[GlossaryTerm]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(GlossaryTerm).where(GlossaryTerm.project_id == project_id)
        )
        return list(result.scalars().all())
