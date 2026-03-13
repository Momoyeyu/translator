import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select

from common import erri
from conf.db import AsyncSessionLocal
from conf.kafka import get_kafka_producer
from glossary.model import GlossaryTerm
from pipeline.model import PipelineStage, PipelineTask, PipelineTaskStatus
from project.model import ProjectStatus, TranslationProject
from ws.manager import publish_event


async def start_pipeline(project_id: UUID, username: str) -> list[PipelineTask]:
    """Create pipeline tasks and enqueue the first stage."""
    from project.service import get_project_detail

    project = await get_project_detail(project_id, username)
    if project.status != ProjectStatus.CREATED:
        raise erri.bad_request("Pipeline already started or project not in 'created' status")

    # Check concurrency limit
    from conf.config import settings

    running_statuses = [ProjectStatus.PLANNING, ProjectStatus.CLARIFYING, ProjectStatus.TRANSLATING, ProjectStatus.UNIFYING]
    async with AsyncSessionLocal() as session:
        from sqlalchemy import func

        count_result = await session.execute(
            select(func.count()).select_from(TranslationProject).where(
                TranslationProject.user_id == project.user_id,
                TranslationProject.status.in_(running_statuses),
                TranslationProject.is_deleted == False,  # noqa: E712
            )
        )
        running_count = count_result.scalar() or 0
        if running_count >= settings.max_concurrent_projects_per_user:
            raise erri.bad_request(
                f"Too many running projects ({running_count}). "
                f"Max: {settings.max_concurrent_projects_per_user}"
            )

    async with AsyncSessionLocal() as session:
        # Update project status
        result = await session.execute(
            select(TranslationProject).where(TranslationProject.id == project_id)
        )
        proj = result.scalars().one()
        proj.status = ProjectStatus.PLANNING

        # Create pipeline tasks for all stages
        tasks = []
        for stage in PipelineStage:
            task = PipelineTask(project_id=project_id, stage=stage.value)
            session.add(task)
            tasks.append(task)

        await session.commit()
        for t in tasks:
            await session.refresh(t)

    # Enqueue the first stage (plan)
    producer = await get_kafka_producer()
    await producer.send_and_wait(
        "translator.pipeline",
        json.dumps({
            "project_id": str(project_id),
            "task_id": str(tasks[0].id),
            "action": "execute_stage",
            "stage": "plan",
        }).encode("utf-8"),
            key=str(project_id).encode("utf-8"),
    )

    await publish_event(project_id, {"seq": 1, "event": "pipeline_stage_started", "data": {"stage": "plan"}})

    return tasks


async def get_pipeline_status(project_id: UUID) -> list[PipelineTask]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PipelineTask).where(PipelineTask.project_id == project_id).order_by(PipelineTask.created_at)
        )
        return list(result.scalars().all())


async def confirm_glossary(project_id: UUID, username: str) -> None:
    """Confirm all glossary terms and resume pipeline from translate stage."""
    from project.service import get_project_detail

    project = await get_project_detail(project_id, username)
    if project.status != ProjectStatus.CLARIFYING:
        raise erri.bad_request("Project is not in clarifying status")

    async with AsyncSessionLocal() as session:
        # Confirm all terms
        from sqlalchemy import update

        await session.execute(
            update(GlossaryTerm).where(GlossaryTerm.project_id == project_id).values(confirmed=True)
        )

        # Update clarify task to completed
        result = await session.execute(
            select(PipelineTask).where(
                PipelineTask.project_id == project_id, PipelineTask.stage == PipelineStage.CLARIFY
            )
        )
        clarify_task = result.scalars().one_or_none()
        if clarify_task:
            clarify_task.status = PipelineTaskStatus.COMPLETED
            clarify_task.completed_at = datetime.now(UTC)

        # Update project status
        proj_result = await session.execute(
            select(TranslationProject).where(TranslationProject.id == project_id)
        )
        proj = proj_result.scalars().one()
        proj.status = ProjectStatus.TRANSLATING

        await session.commit()

    # Enqueue translate stage
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PipelineTask).where(
                PipelineTask.project_id == project_id, PipelineTask.stage == PipelineStage.TRANSLATE
            )
        )
        translate_task = result.scalars().one_or_none()

    if translate_task:
        producer = await get_kafka_producer()
        await producer.send_and_wait(
            "translator.pipeline",
            json.dumps({
                "project_id": str(project_id),
                "task_id": str(translate_task.id),
                "action": "execute_stage",
                "stage": "translate",
            }).encode("utf-8"),
            key=str(project_id).encode("utf-8"),
        )

    await publish_event(project_id, {"seq": 0, "event": "pipeline_stage_started", "data": {"stage": "translate"}})


async def cancel_pipeline(project_id: UUID, username: str) -> None:
    """Cancel a running pipeline."""
    from project.service import get_project_detail

    project = await get_project_detail(project_id, username)
    if project.status in (ProjectStatus.COMPLETED, ProjectStatus.FAILED, ProjectStatus.CANCELLED):
        raise erri.bad_request("Pipeline is already in a terminal state")

    async with AsyncSessionLocal() as session:
        # Cancel all non-completed tasks
        result = await session.execute(
            select(PipelineTask).where(PipelineTask.project_id == project_id)
        )
        for task in result.scalars().all():
            if task.status not in (PipelineTaskStatus.COMPLETED, PipelineTaskStatus.FAILED):
                task.status = PipelineTaskStatus.CANCELLED

        # Update project status
        proj_result = await session.execute(
            select(TranslationProject).where(TranslationProject.id == project_id)
        )
        proj = proj_result.scalars().one()
        proj.status = ProjectStatus.CANCELLED
        await session.commit()

    await publish_event(project_id, {"seq": 0, "event": "pipeline_cancelled", "data": {}})


async def retry_pipeline(project_id: UUID, username: str) -> PipelineTask:
    """Retry the last failed stage."""
    from project.service import get_project_detail

    project = await get_project_detail(project_id, username)
    if project.status != ProjectStatus.FAILED:
        raise erri.bad_request("Can only retry failed pipelines")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(PipelineTask)
            .where(PipelineTask.project_id == project_id, PipelineTask.status == PipelineTaskStatus.FAILED)
            .order_by(PipelineTask.created_at.desc())
            .limit(1)
        )
        failed_task = result.scalars().one_or_none()
        if not failed_task:
            raise erri.not_found("No failed task found")

        failed_task.status = PipelineTaskStatus.QUEUED
        failed_task.error_message = None

        # Update project status to match the retried stage
        stage_to_status = {
            PipelineStage.PLAN: ProjectStatus.PLANNING,
            PipelineStage.CLARIFY: ProjectStatus.CLARIFYING,
            PipelineStage.TRANSLATE: ProjectStatus.TRANSLATING,
            PipelineStage.UNIFY: ProjectStatus.UNIFYING,
        }
        proj_result = await session.execute(
            select(TranslationProject).where(TranslationProject.id == project_id)
        )
        proj = proj_result.scalars().one()
        proj.status = stage_to_status.get(PipelineStage(failed_task.stage), ProjectStatus.PLANNING)

        await session.commit()
        await session.refresh(failed_task)

    # Re-enqueue
    producer = await get_kafka_producer()
    await producer.send_and_wait(
        "translator.pipeline",
        json.dumps({
            "project_id": str(project_id),
            "task_id": str(failed_task.id),
            "action": "execute_stage",
            "stage": failed_task.stage,
        }).encode("utf-8"),
            key=str(project_id).encode("utf-8"),
    )

    return failed_task
