from uuid import UUID

from fastapi import APIRouter, Request

from common.resp import Response, ok
from glossary import service
from glossary.dto import CreateGlossaryTermRequest, GlossaryTermResponse, UpdateGlossaryTermRequest
from middleware import auth

router = APIRouter(prefix="/projects/{project_id}/glossary", tags=["glossary"])


@router.get("")
async def list_glossary(request: Request, project_id: UUID) -> Response:
    username = auth.get_username(request)
    terms = await service.get_project_glossary(project_id, username)
    return ok(data=[GlossaryTermResponse.model_validate(t).model_dump(mode="json") for t in terms])


@router.post("")
async def create_term(request: Request, project_id: UUID, body: CreateGlossaryTermRequest) -> Response:
    username = auth.get_username(request)
    term = await service.create_term(project_id, body, username)
    return ok(data=GlossaryTermResponse.model_validate(term).model_dump(mode="json"))


@router.put("/{term_id}")
async def update_term(request: Request, project_id: UUID, term_id: UUID, body: UpdateGlossaryTermRequest) -> Response:
    username = auth.get_username(request)
    term = await service.update_term(project_id, term_id, body.translated_term, username)
    return ok(data=GlossaryTermResponse.model_validate(term).model_dump(mode="json"))
