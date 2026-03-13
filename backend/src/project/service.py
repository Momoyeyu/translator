from uuid import UUID

from sqlalchemy import select
from uuid6 import uuid7

from common import erri
from conf.db import AsyncSessionLocal
from document.extractor import UnsupportedFormatError, extract_text
from document.model import Document
from project.dto import ProjectConfig, UpdateProjectRequest
from project.model import ProjectStatus, TranslationProject
from storage.service import StorageService
from user.model import get_user


async def _resolve_user(username: str):
    """Look up user by username, return (user_id, tenant_id)."""
    user = await get_user(username)
    if not user:
        raise erri.not_found("User not found")
    # For v1, use user.id as both user_id and tenant_id
    return user.id, user.id


async def create_project(
    username: str,
    title: str,
    target_language: str,
    source_language: str | None,
    config: ProjectConfig,
    file_name: str,
    file_data: bytes,
    mime_type: str,
) -> TranslationProject:
    user_id, tenant_id = await _resolve_user(username)

    import asyncio

    try:
        extracted_text = await asyncio.to_thread(extract_text, file_data, mime_type)
    except UnsupportedFormatError:
        raise erri.bad_request(f"Unsupported document format: {mime_type}")

    if not extracted_text.strip():
        raise erri.bad_request("Document contains no extractable text")

    storage = StorageService()
    ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
    project_id = uuid7()
    storage_key, content_hash = await storage.upload_file(
        tenant_id=tenant_id,
        project_id=project_id,
        category="source",
        data=file_data,
        content_type=mime_type,
        ext=ext,
    )

    async with AsyncSessionLocal() as session:
        project = TranslationProject(
            id=project_id,
            user_id=user_id,
            tenant_id=tenant_id,
            title=title,
            source_language=source_language,
            target_language=target_language,
            config=config.model_dump(),
        )
        session.add(project)
        await session.flush()

        doc = Document(
            project_id=project.id,
            file_name=file_name,
            mime_type=mime_type,
            file_size=len(file_data),
            storage_key=storage_key,
            content_hash=content_hash,
            extracted_text=extracted_text,
        )
        session.add(doc)
        await session.commit()
        await session.refresh(project)
        return project


async def get_project_detail(project_id: UUID, username: str) -> TranslationProject:
    user_id, _ = await _resolve_user(username)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject).where(
                TranslationProject.id == project_id,
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,  # noqa: E712
            )
        )
        project = result.scalars().one_or_none()
        if not project:
            raise erri.not_found("Project not found")
        return project


async def get_user_projects(username: str, page: int = 1, page_size: int = 20) -> list[TranslationProject]:
    user_id, _ = await _resolve_user(username)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject)
            .where(TranslationProject.user_id == user_id, TranslationProject.is_deleted == False)  # noqa: E712
            .order_by(TranslationProject.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return list(result.scalars().all())


async def update_project(project_id: UUID, username: str, body: UpdateProjectRequest) -> TranslationProject:
    user_id, _ = await _resolve_user(username)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject).where(
                TranslationProject.id == project_id,
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,  # noqa: E712
            )
        )
        project = result.scalars().one_or_none()
        if not project:
            raise erri.not_found("Project not found")
        if project.status != ProjectStatus.CREATED:
            raise erri.bad_request("Can only update projects in 'created' status")

        if body.title is not None:
            project.title = body.title
        if body.config is not None:
            project.config = body.config.model_dump()
        await session.commit()
        await session.refresh(project)
        return project


async def delete_project(project_id: UUID, username: str) -> None:
    from datetime import UTC, datetime

    user_id, _ = await _resolve_user(username)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(TranslationProject).where(
                TranslationProject.id == project_id,
                TranslationProject.user_id == user_id,
                TranslationProject.is_deleted == False,  # noqa: E712
            )
        )
        project = result.scalars().one_or_none()
        if not project:
            raise erri.not_found("Project not found")
        project.is_deleted = True
        project.deleted_at = datetime.now(UTC)
        await session.commit()
