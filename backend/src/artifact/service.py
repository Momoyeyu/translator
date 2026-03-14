import asyncio
from uuid import UUID

from sqlalchemy import select

from artifact.model import Artifact, get_artifacts_by_project
from artifact.pdf_service import markdown_to_pdf
from common import erri
from conf.db import AsyncSessionLocal
from project.model import TranslationProject
from storage.service import StorageService


async def _verify_project_ownership(project_id: UUID, username: str) -> None:
    from project.service import get_project_detail

    await get_project_detail(project_id, username)


async def get_project_artifacts(project_id: UUID, username: str) -> list[Artifact]:
    await _verify_project_ownership(project_id, username)
    return await get_artifacts_by_project(project_id)


async def export_artifact_as_pdf(project_id: UUID, artifact_id: UUID, username: str) -> Artifact:
    """Convert an existing markdown artifact to PDF and store as new artifact."""
    await _verify_project_ownership(project_id, username)

    # Single read session: load both artifact and project
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Artifact).where(Artifact.id == artifact_id, Artifact.project_id == project_id)
        )
        artifact = result.scalars().one_or_none()
        if not artifact:
            raise erri.not_found("Artifact not found")
        if artifact.format != "markdown":
            raise erri.bad_request("Only markdown artifacts can be exported as PDF")

        proj_result = await session.execute(
            select(TranslationProject).where(TranslationProject.id == project_id)
        )
        proj = proj_result.scalars().one()

    storage = StorageService()
    md_bytes = await storage.download_file(artifact.storage_key)
    md_text = md_bytes.decode("utf-8")

    loop = asyncio.get_running_loop()
    pdf_bytes = await loop.run_in_executor(None, markdown_to_pdf, md_text, artifact.title)

    storage_key, _ = await storage.upload_file(
        tenant_id=proj.tenant_id,
        project_id=project_id,
        category="artifact",
        data=pdf_bytes,
        content_type="application/pdf",
        ext="pdf",
    )

    # Single write session: create the PDF artifact
    async with AsyncSessionLocal() as session:
        pdf_artifact = Artifact(
            project_id=project_id,
            document_id=artifact.document_id,
            title=artifact.title.replace(" - Translation", " - Translation (PDF)") if " - Translation" in artifact.title else f"{artifact.title} (PDF)",
            format="pdf",
            storage_key=storage_key,
            file_size=len(pdf_bytes),
        )
        session.add(pdf_artifact)
        await session.commit()
        await session.refresh(pdf_artifact)
        return pdf_artifact


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
