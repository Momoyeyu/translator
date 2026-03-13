from uuid import UUID

from sqlalchemy import select

from artifact.model import Artifact, get_artifacts_by_project
from common import erri
from conf.db import AsyncSessionLocal
from storage.service import StorageService


async def get_project_artifacts(project_id: UUID) -> list[Artifact]:
    return await get_artifacts_by_project(project_id)


async def download_artifact(project_id: UUID, artifact_id: UUID) -> tuple[bytes, str, str]:
    """Returns (file_data, content_type, filename)."""
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
    filename = f"{artifact.title}.{ext}"

    return data, content_type, filename
