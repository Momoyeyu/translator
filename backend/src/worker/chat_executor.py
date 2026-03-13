from uuid import UUID

from loguru import logger
from sqlalchemy import select

from conf.db import AsyncSessionLocal
from conversation.model import Message, MessageRole
from glossary.model import GlossaryTerm
from llm.prompts.chat import build_chat_messages
from llm.service import LLMProfile, LLMService
from project.model import TranslationProject
from worker.base import BaseWorker
from ws.manager import publish_event


class ChatExecutor(BaseWorker):
    def __init__(self, llm: LLMService):
        super().__init__(topic="translator.chat", max_concurrency=5)
        self.llm = llm

    async def handle_message(self, message: dict) -> None:
        project_id = UUID(message["project_id"])
        conversation_id = UUID(message["conversation_id"])
        user_content = message["content"]

        logger.info(f"Processing chat message for project={project_id}")

        async with AsyncSessionLocal() as session:
            # Load project
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()

            # Load glossary
            glossary_result = await session.execute(
                select(GlossaryTerm).where(GlossaryTerm.project_id == project_id)
            )
            glossary = [
                {"source_term": t.source_term, "translated_term": t.translated_term}
                for t in glossary_result.scalars().all()
            ]

            # Load recent conversation history
            msgs_result = await session.execute(
                select(Message)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc())
                .limit(20)
            )
            recent_msgs = list(reversed(list(msgs_result.scalars().all())))

        # Build conversation history for LLM
        history = []
        for m in recent_msgs:
            if m.role == MessageRole.USER:
                history.append({"role": "user", "content": m.content})
            else:
                history.append({"role": "assistant", "content": m.content})

        # Remove the last user message (it's the current one)
        if history and history[-1]["role"] == "user":
            history = history[:-1]

        messages = build_chat_messages(
            conversation_history=history,
            user_message=user_content,
            source_lang=proj.source_language or "auto",
            target_lang=proj.target_language,
            glossary=glossary,
        )

        response = await self.llm.chat(messages, LLMProfile.DEFAULT)

        # Save assistant response
        async with AsyncSessionLocal() as session:
            assistant_msg = Message(
                conversation_id=conversation_id,
                role=MessageRole.ASSISTANT,
                type="reply",
                content=response,
            )
            session.add(assistant_msg)
            await session.commit()
            await session.refresh(assistant_msg)

        await publish_event(project_id, {
            "seq": 0,
            "event": "chat_message",
            "data": {"message_id": str(assistant_msg.id), "content": response},
        })
