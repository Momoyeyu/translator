"""Pipeline event persistence and retrieval."""
from datetime import UTC, datetime
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import DateTime, ForeignKey, Integer, String, Uuid, func, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base
from pipeline.events import PipelineEventType


class PipelineEvent(Base):
    __tablename__ = "pipeline_event"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("translation_project.id"), index=True)
    stage: Mapped[str] = mapped_column(String(20))
    event_type: Mapped[str] = mapped_column(String(30))
    sequence: Mapped[int] = mapped_column(Integer)
    data: Mapped[dict | None] = mapped_column(JSONB, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class EventStore:
    async def emit(self, project_id: UUID, stage: str, event_type: PipelineEventType, data: BaseModel | None = None) -> PipelineEvent:
        from ws.manager import publish_event

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(func.coalesce(func.max(PipelineEvent.sequence), 0)).where(PipelineEvent.project_id == project_id)
            )
            next_seq = (result.scalar() or 0) + 1

            event = PipelineEvent(
                project_id=project_id,
                stage=stage,
                event_type=event_type.value,
                sequence=next_seq,
                data=data.model_dump() if data else None,
            )
            session.add(event)
            await session.commit()
            await session.refresh(event)

        await publish_event(project_id, {
            "seq": event.sequence,
            "event": event_type.value,
            "stage": stage,
            "data": data.model_dump() if data else None,
        })
        return event

    async def get_events(self, project_id: UUID, after_sequence: int = 0, limit: int = 500) -> list[PipelineEvent]:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(PipelineEvent)
                .where(PipelineEvent.project_id == project_id, PipelineEvent.sequence > after_sequence)
                .order_by(PipelineEvent.sequence)
                .limit(limit)
            )
            return list(result.scalars().all())


event_store = EventStore()
