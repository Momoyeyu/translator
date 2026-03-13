from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, String, Text, Uuid, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from uuid6 import uuid7

from conf.db import AsyncSessionLocal, Base


class MessageRole(StrEnum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(Base):
    __tablename__ = "conversation"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    project_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("translation_project.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class Message(Base):
    __tablename__ = "message"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)
    conversation_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("conversation.id"))
    role: Mapped[str] = mapped_column(String(20))
    type: Mapped[str] = mapped_column(String(31))
    content: Mapped[str] = mapped_column(Text, default="")
    detail: Mapped[dict | None] = mapped_column(JSONB, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


async def get_or_create_conversation(project_id: UUID) -> Conversation:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Conversation).where(Conversation.project_id == project_id)
        )
        conv = result.scalars().one_or_none()
        if conv is None:
            conv = Conversation(project_id=project_id)
            session.add(conv)
            await session.commit()
            await session.refresh(conv)
        return conv


async def get_messages(conversation_id: UUID, cursor: UUID | None = None, limit: int = 50) -> list[Message]:
    async with AsyncSessionLocal() as session:
        query = select(Message).where(Message.conversation_id == conversation_id)
        if cursor:
            cursor_msg = await session.get(Message, cursor)
            if cursor_msg:
                query = query.where(Message.created_at < cursor_msg.created_at)
        query = query.order_by(Message.created_at.desc()).limit(limit)
        result = await session.execute(query)
        return list(result.scalars().all())
