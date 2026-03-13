from uuid import UUID

from fastapi import APIRouter, Request

from common.resp import Response, ok
from middleware import auth
from pipeline import service
from pipeline.dto import PipelineTaskResponse

router = APIRouter(prefix="/projects/{project_id}", tags=["pipeline"])


@router.post("/start")
async def start_pipeline(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    tasks = await service.start_pipeline(project_id, username)
    return ok(data=[PipelineTaskResponse.model_validate(t).model_dump(mode="json") for t in tasks])


@router.get("/pipeline")
async def get_pipeline(request: Request, project_id: UUID) -> Response:
    auth.get_username(request)  # auth check
    tasks = await service.get_pipeline_status(project_id)
    return ok(data=[PipelineTaskResponse.model_validate(t).model_dump(mode="json") for t in tasks])


@router.post("/clarify/confirm")
async def confirm_glossary(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    await service.confirm_glossary(project_id, username)
    return ok(message="Glossary confirmed, translation started")


@router.post("/cancel")
async def cancel_pipeline(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    await service.cancel_pipeline(project_id, username)
    return ok(message="Pipeline cancelled")


@router.post("/retry")
async def retry_pipeline(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    task = await service.retry_pipeline(project_id, username)
    return ok(data=PipelineTaskResponse.model_validate(task).model_dump(mode="json"))
