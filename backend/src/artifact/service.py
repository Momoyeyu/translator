import asyncio
from uuid import UUID

from sqlalchemy import select

from artifact.model import Artifact, get_artifacts_by_project
from artifact.pdf_service import markdown_to_pdf
from common import erri
from conf.db import AsyncSessionLocal
from storage.service import StorageService


async def _verify_project_ownership(project_id: UUID, username: str) -> None:
    from project.service import get_project_detail

    await get_project_detail(project_id, username)


async def get_project_artifacts(project_id: UUID, username: str) -> list[Artifact]:
    await _verify_project_ownership(project_id, username)
    return await get_artifacts_by_project(project_id)


async def generate_pdf_on_the_fly(project_id: UUID, artifact_id: UUID, username: str) -> tuple[bytes, str]:
    """Generate PDF from a markdown artifact without storing it."""
    await _verify_project_ownership(project_id, username)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Artifact).where(Artifact.id == artifact_id, Artifact.project_id == project_id)
        )
        artifact = result.scalars().one_or_none()
        if not artifact:
            raise erri.not_found("Artifact not found")
        if artifact.format != "markdown":
            raise erri.bad_request("Can only export markdown artifacts to PDF")

    # Download the markdown content
    storage = StorageService()
    md_bytes = await storage.download_file(artifact.storage_key)
    md_text = md_bytes.decode("utf-8")

    # Generate PDF in memory (no storage)
    pdf_bytes = await asyncio.to_thread(markdown_to_pdf, md_text, artifact.title)

    safe_title = "".join(c for c in artifact.title if c.isalnum() or c in " -_").strip()
    filename = f"{safe_title or 'translation'}.pdf"

    return pdf_bytes, filename


async def download_artifact(project_id: UUID, artifact_id: UUID, username: str) -> tuple[bytes, str, str]:
    """Returns (file_data, content_type, filename)."""
    await _verify_project_ownership(project_id, username)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Artifact).where(Artifact.id == artifact_id, Artifact.project_id == project_id)
        )
        artifact = result.scalars().one_or_none()
        if not artifact:
            raise erri.not_found("Artifact not found")

    storage = StorageService()
    data = await storage.download_file(artifact.storage_key)

    content_type = "text/markdown" if artifact.format == "markdown" else "application/pdf"
    ext = "md" if artifact.format == "markdown" else "pdf"
    # Sanitize filename
    safe_title = "".join(c for c in artifact.title if c.isalnum() or c in " -_").strip()
    filename = f"{safe_title or 'translation'}.{ext}"

    return data, content_type, filename
