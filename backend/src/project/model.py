from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import Boolean, DateTime, String, Uuid, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class ProjectStatus(StrEnum):
    CREATED = "created"
    PLANNING = "planning"
    CLARIFYING = "clarifying"
    TRANSLATING = "translating"
    UNIFYING = "unifying"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TranslationProject(Base):
    __tablename__ = "translation_project"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    user_id: Mapped[UUID] = mapped_column(Uuid, index=True)
    tenant_id: Mapped[UUID] = mapped_column(Uuid, index=True)
    title: Mapped[str] = mapped_column(String(255))
    source_language: Mapped[str | None] = mapped_column(String(10), default=None)
    target_language: Mapped[str] = mapped_column(String(10))
    status: Mapped[str] = mapped_column(String(20), default=ProjectStatus.CREATED)
    config: Mapped[dict | None] = mapped_column(JSONB, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)


async def get_project(project_id: UUID, user_id: UUID) -> TranslationProject | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject).where(
                TranslationProject.id == project_id,
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,  # noqa: E712
            )
        )
        return result.scalars().one_or_none()


async def list_projects(user_id: UUID, page: int = 1, page_size: int = 20) -> list[TranslationProject]:
    async with AsyncSessionLocal() as session:
        offset = (page - 1) * page_size
        result = await session.execute(
            select(TranslationProject)
            .where(
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,  # noqa: E712
            )
            .order_by(TranslationProject.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        return list(result.scalars().all())
