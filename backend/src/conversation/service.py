import json
from uuid import UUID

from common import erri
from conf.db import AsyncSessionLocal
from conf.kafka import get_kafka_producer
from conversation.model import Message, MessageRole, get_messages, get_or_create_conversation
from project.model import ProjectStatus


async def send_chat_message(project_id: UUID, username: str, content: str) -> Message:
    """Send a user message and enqueue LLM response generation."""
    from project.service import get_project_detail

    project = await get_project_detail(project_id, username)
    if project.status != ProjectStatus.COMPLETED:
        raise erri.bad_request("Chat is available only after translation is completed")

    conv = await get_or_create_conversation(project_id)

    async with AsyncSessionLocal() as session:
        msg = Message(
            conversation_id=conv.id,
            role=MessageRole.USER,
            type="text",
            content=content,
        )
        session.add(msg)
        await session.commit()
        await session.refresh(msg)

    # Enqueue chat task for LLM response
    producer = await get_kafka_producer()
    await producer.send_and_wait(
        "translator.chat",
        json.dumps({
            "project_id": str(project_id),
            "conversation_id": str(conv.id),
            "message_id": str(msg.id),
            "content": content,
        }).encode("utf-8"),
    )

    return msg


async def get_chat_history(project_id: UUID, cursor: UUID | None = None, limit: int = 50) -> list[Message]:
    conv = await get_or_create_conversation(project_id)
    return await get_messages(conv.id, cursor=cursor, limit=limit)
