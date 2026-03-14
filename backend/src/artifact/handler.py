from uuid import UUID

from fastapi import APIRouter, Request
from fastapi.responses import Response as RawResponse

from artifact import service
from artifact.dto import ArtifactResponse
from common.resp import Response, ok
from middleware import auth

router = APIRouter(prefix="/projects/{project_id}/artifacts", tags=["artifacts"])


@router.get("")
async def list_artifacts(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    artifacts = await service.get_project_artifacts(project_id, username)
    return ok(data=[ArtifactResponse.model_validate(a).model_dump(mode="json") for a in artifacts])


@router.post("/{artifact_id}/export-pdf")
async def export_pdf(request: Request, project_id: UUID, artifact_id: UUID) -> Response:
    username = auth.get_username(request)
    artifact = await service.export_artifact_as_pdf(project_id, artifact_id, username)
    return ok(data=ArtifactResponse.model_validate(artifact).model_dump(mode="json"))


@router.get("/{artifact_id}/download")
async def download_artifact(request: Request, project_id: UUID, artifact_id: UUID) -> RawResponse:
    username = auth.get_username(request)
    data, content_type, filename = await service.download_artifact(project_id, artifact_id, username)
    return RawResponse(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
