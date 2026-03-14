import asyncio
import json
import re
from chunk.model import Chunk, ChunkStatus
from datetime import UTC, datetime
from uuid import UUID

from loguru import logger
from sqlalchemy import select

from artifact.model import Artifact
from artifact.pdf_service import markdown_to_pdf
from conf.db import AsyncSessionLocal
from conf.kafka import get_kafka_producer
from document.model import Document
from glossary.model import GlossaryTerm
from llm.prompts.clarify import build_clarify_messages
from llm.prompts.plan import build_plan_messages
from llm.prompts.translate import build_translate_messages
from llm.prompts.unify import build_unify_messages
from llm.service import LLMProfile, LLMService
from pipeline.model import PipelineStage, PipelineTask, PipelineTaskStatus
from project.model import ProjectStatus, TranslationProject
from storage.service import StorageService
from worker.base import BaseWorker
from ws.manager import publish_event


def _parse_llm_json(text: str) -> list | dict:
    """Parse JSON from LLM response, stripping markdown code blocks if present."""
    cleaned = re.sub(r'^```(?:json)?\s*\n?', '', text.strip())
    cleaned = re.sub(r'\n?```\s*$', '', cleaned)
    return json.loads(cleaned)


class PipelineExecutor(BaseWorker):
    def __init__(self, llm: LLMService):
        super().__init__(topic="translator.pipeline", max_concurrency=3)
        self.llm = llm

    async def handle_message(self, message: dict) -> None:
        project_id = UUID(message["project_id"])
        task_id = UUID(message["task_id"])
        stage = message["stage"]

        logger.info(f"Executing stage={stage} for project={project_id}")

        # Idempotency check
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(PipelineTask).where(PipelineTask.id == task_id))
            task = result.scalars().one_or_none()
            if not task or task.status == PipelineTaskStatus.COMPLETED:
                logger.info(f"Task {task_id} already completed, skipping")
                return

            task.status = PipelineTaskStatus.RUNNING
            task.started_at = datetime.now(UTC)
            await session.commit()

        try:
            if stage == PipelineStage.PLAN:
                await self._execute_plan(project_id, task_id)
            elif stage == PipelineStage.CLARIFY:
                await self._execute_clarify(project_id, task_id)
            elif stage == PipelineStage.TRANSLATE:
                await self._execute_translate(project_id, task_id)
            elif stage == PipelineStage.UNIFY:
                await self._execute_unify(project_id, task_id)

        except Exception as e:
            logger.exception(f"Stage {stage} failed for project {project_id}: {e}")
            await self._fail_task(project_id, task_id, str(e))

    async def _execute_plan(self, project_id: UUID, task_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            doc_result = await session.execute(select(Document).where(Document.project_id == project_id))
            doc = doc_result.scalars().one()
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()

        config = proj.config or {}
        messages = build_plan_messages(doc.extracted_text, config)
        response = await self.llm.chat(messages, LLMProfile.FAST)

        # Parse LLM response as JSON array of chunks
        try:
            chunks_data = _parse_llm_json(response)
        except (json.JSONDecodeError, ValueError):
            logger.warning("Failed to parse plan response as JSON, wrapping entire text as single chunk")
            chunks_data = [{"chunk_index": 0, "source_text": doc.extracted_text, "metadata": {}}]
        if not isinstance(chunks_data, list):
            chunks_data = [{"chunk_index": 0, "source_text": doc.extracted_text, "metadata": {}}]

        async with AsyncSessionLocal() as session:
            # Delete existing chunks (idempotency)
            existing = await session.execute(select(Chunk).where(Chunk.project_id == project_id))
            for c in existing.scalars().all():
                await session.delete(c)

            for item in chunks_data:
                chunk = Chunk(
                    project_id=project_id,
                    document_id=doc.id,
                    chunk_index=item.get("chunk_index", 0),
                    source_text=item["source_text"],
                    chunk_metadata=item.get("metadata", {}),
                )
                session.add(chunk)
            await session.commit()

        await self._complete_task(task_id, {"chunks_count": len(chunks_data)})
        await self._advance_stage(project_id, PipelineStage.CLARIFY)

    async def _execute_clarify(self, project_id: UUID, task_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            chunks_result = await session.execute(
                select(Chunk).where(Chunk.project_id == project_id).order_by(Chunk.chunk_index)
            )
            chunks = chunks_result.scalars().all()
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()

        config = proj.config or {}
        if config.get("skip_clarify"):
            await self._complete_task(task_id, {"terms_count": 0, "skipped": True})
            await self._advance_stage(project_id, PipelineStage.TRANSLATE)
            return

        source_text = "\n\n".join(c.source_text for c in chunks)
        source_lang = proj.source_language or "auto"
        target_lang = proj.target_language

        messages = build_clarify_messages(source_text, source_lang, target_lang)
        response = await self.llm.chat(messages, LLMProfile.FAST)

        try:
            terms_data = _parse_llm_json(response)
        except (json.JSONDecodeError, ValueError):
            terms_data = []

        if not isinstance(terms_data, list):
            terms_data = []

        async with AsyncSessionLocal() as session:
            for item in terms_data:
                term = GlossaryTerm(
                    project_id=project_id,
                    source_term=item.get("source_term", ""),
                    translated_term=item.get("translated_term", ""),
                    context=item.get("context", ""),
                )
                session.add(term)
            await session.commit()

        if terms_data:
            # Pause: set task to awaiting_input
            async with AsyncSessionLocal() as session:
                result = await session.execute(select(PipelineTask).where(PipelineTask.id == task_id))
                task = result.scalars().one()
                task.status = PipelineTaskStatus.AWAITING_INPUT
                task.result = {"terms_count": len(terms_data)}

                proj_result = await session.execute(
                    select(TranslationProject).where(TranslationProject.id == project_id)
                )
                proj = proj_result.scalars().one()
                proj.status = ProjectStatus.CLARIFYING
                await session.commit()

            await publish_event(project_id, {
                "seq": 0,
                "event": "clarify_request",
                "data": {"terms_count": len(terms_data)},
            })
        else:
            await self._complete_task(task_id, {"terms_count": 0})
            await self._advance_stage(project_id, PipelineStage.TRANSLATE)

    async def _execute_translate(self, project_id: UUID, task_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            chunks_result = await session.execute(
                select(Chunk).where(Chunk.project_id == project_id).order_by(Chunk.chunk_index)
            )
            chunks = list(chunks_result.scalars().all())
            glossary_result = await session.execute(
                select(GlossaryTerm).where(GlossaryTerm.project_id == project_id, GlossaryTerm.confirmed == True)  # noqa: E712
            )
            glossary = [{"source_term": t.source_term, "translated_term": t.translated_term} for t in glossary_result.scalars().all()]
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()

        config = proj.config or {}
        target_lang = proj.target_language
        previous_context = ""

        for i, chunk in enumerate(chunks):
            messages = build_translate_messages(
                chunk.source_text, target_lang, glossary, previous_context, config
            )
            translated = await self.llm.chat(messages, LLMProfile.DEFAULT)

            async with AsyncSessionLocal() as session:
                result = await session.execute(select(Chunk).where(Chunk.id == chunk.id))
                c = result.scalars().one()
                c.translated_text = translated
                c.status = ChunkStatus.COMPLETED
                await session.commit()

            # Keep last 200 chars as context for next chunk
            previous_context = translated[-200:] if len(translated) > 200 else translated

            await publish_event(project_id, {
                "seq": 0,
                "event": "pipeline_progress",
                "data": {"stage": "translate", "current_chunk": i + 1, "total_chunks": len(chunks)},
            })

        await self._complete_task(task_id, {"chunks_translated": len(chunks)})
        await self._advance_stage(project_id, PipelineStage.UNIFY)

    async def _execute_unify(self, project_id: UUID, task_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            chunks_result = await session.execute(
                select(Chunk).where(Chunk.project_id == project_id).order_by(Chunk.chunk_index)
            )
            chunks = [{"translated_text": c.translated_text} for c in chunks_result.scalars().all()]
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()
            doc_result = await session.execute(select(Document).where(Document.project_id == project_id))
            doc = doc_result.scalars().one()

        messages = build_unify_messages(chunks, proj.target_language)
        final_md = await self.llm.chat(messages, LLMProfile.PRO)

        # Store artifact
        storage = StorageService()
        md_bytes = final_md.encode("utf-8")
        storage_key, _ = await storage.upload_file(
            tenant_id=proj.tenant_id,
            project_id=project_id,
            category="artifact",
            data=md_bytes,
            content_type="text/markdown",
            ext="md",
        )

        async with AsyncSessionLocal() as session:
            artifact = Artifact(
                project_id=project_id,
                document_id=doc.id,
                title=f"{proj.title} - Translation",
                format="markdown",
                storage_key=storage_key,
                file_size=len(md_bytes),
            )
            session.add(artifact)

            # Mark project completed
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            p = proj_result.scalars().one()
            p.status = ProjectStatus.COMPLETED
            await session.commit()

        # Also generate PDF artifact
        try:
            loop = asyncio.get_running_loop()
            pdf_bytes = await loop.run_in_executor(None, markdown_to_pdf, final_md, f"{proj.title} - Translation")
            pdf_key, _ = await storage.upload_file(
                tenant_id=proj.tenant_id,
                project_id=project_id,
                category="artifact",
                data=pdf_bytes,
                content_type="application/pdf",
                ext="pdf",
            )
            async with AsyncSessionLocal() as session:
                pdf_artifact = Artifact(
                    project_id=project_id,
                    document_id=doc.id,
                    title=f"{proj.title} - Translation (PDF)",
                    format="pdf",
                    storage_key=pdf_key,
                    file_size=len(pdf_bytes),
                )
                session.add(pdf_artifact)
                await session.commit()
        except Exception as e:
            logger.warning(f"PDF generation failed for project {project_id}, skipping: {e}")

        await self._complete_task(task_id, {"artifact_format": "markdown", "file_size": len(md_bytes)})
        await publish_event(project_id, {"seq": 0, "event": "pipeline_completed", "data": {}})

    async def _complete_task(self, task_id: UUID, result: dict) -> None:
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(PipelineTask).where(PipelineTask.id == task_id))
            task = res.scalars().one()
            task.status = PipelineTaskStatus.COMPLETED
            task.completed_at = datetime.now(UTC)
            task.result = result
            await session.commit()

    async def _fail_task(self, project_id: UUID, task_id: UUID, error: str) -> None:
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(PipelineTask).where(PipelineTask.id == task_id))
            task = res.scalars().one()
            task.status = PipelineTaskStatus.FAILED
            task.error_message = error

            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()
            proj.status = ProjectStatus.FAILED
            await session.commit()

        await publish_event(project_id, {"seq": 0, "event": "pipeline_failed", "data": {"error": error}})

    async def _advance_stage(self, project_id: UUID, next_stage: PipelineStage) -> None:
        """Enqueue the next pipeline stage."""
        stage_to_status = {
            PipelineStage.CLARIFY: ProjectStatus.CLARIFYING,
            PipelineStage.TRANSLATE: ProjectStatus.TRANSLATING,
            PipelineStage.UNIFY: ProjectStatus.UNIFYING,
        }

        async with AsyncSessionLocal() as session:
            # Update project status
            proj_result = await session.execute(
                select(TranslationProject).where(TranslationProject.id == project_id)
            )
            proj = proj_result.scalars().one()
            proj.status = stage_to_status.get(next_stage, proj.status)

            # Get the task for next stage
            task_result = await session.execute(
                select(PipelineTask).where(
                    PipelineTask.project_id == project_id, PipelineTask.stage == next_stage.value
                )
            )
            next_task = task_result.scalars().one_or_none()
            await session.commit()

        if next_task:
            producer = await get_kafka_producer()
            await producer.send_and_wait(
                "translator.pipeline",
                json.dumps({
                    "project_id": str(project_id),
                    "task_id": str(next_task.id),
                    "action": "execute_stage",
                    "stage": next_stage.value,
                }).encode("utf-8"),
            key=str(project_id).encode("utf-8"),
            )
            await publish_event(project_id, {
                "seq": 0,
                "event": "pipeline_stage_started",
                "data": {"stage": next_stage.value},
            })
