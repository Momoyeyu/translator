from uuid import UUID

from fastapi import APIRouter, File, Form, Request, UploadFile

from common.resp import Response, ok
from conf.config import settings
from middleware import auth
from project import service
from project.dto import ProjectConfig, ProjectResponse, UpdateProjectRequest

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("")
async def create_project(
    request: Request,
    file: UploadFile = File(...),
    title: str = Form(...),
    target_language: str = Form(...),
    source_language: str | None = Form(None),
    formality: str = Form("neutral"),
    domain: str | None = Form(None),
    skip_clarify: bool = Form(False),
) -> Response:
    username = auth.get_username(request)

    file_data = await file.read()
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if len(file_data) > max_bytes:
        from common import erri

        raise erri.bad_request(f"File too large. Max: {settings.max_upload_size_mb}MB")
    config = ProjectConfig(formality=formality, domain=domain, skip_clarify=skip_clarify)

    project = await service.create_project(
        username=username,
        title=title,
        target_language=target_language,
        source_language=source_language,
        config=config,
        file_name=file.filename or "upload",
        file_data=file_data,
        mime_type=file.content_type or "application/octet-stream",
    )
    return ok(data=ProjectResponse.model_validate(project).model_dump(mode="json"))


@router.get("")
async def list_projects(request: Request, page: int = 1, page_size: int = 20) -> Response:
    username = auth.get_username(request)
    projects = await service.get_user_projects(username, page, min(page_size, 100))
    return ok(data=[ProjectResponse.model_validate(p).model_dump(mode="json") for p in projects])


@router.get("/{project_id}")
async def get_project(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    project = await service.get_project_detail(project_id, username)
    return ok(data=ProjectResponse.model_validate(project).model_dump(mode="json"))


@router.patch("/{project_id}")
async def update_project(request: Request, project_id: UUID, body: UpdateProjectRequest) -> Response:
    username = auth.get_username(request)
    project = await service.update_project(project_id, username, body)
    return ok(data=ProjectResponse.model_validate(project).model_dump(mode="json"))


@router.delete("/{project_id}")
async def delete_project(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    await service.delete_project(project_id, username)
    return ok(message="Project deleted")
