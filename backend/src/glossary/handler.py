from uuid import UUID

from fastapi import APIRouter, Request

from common.resp import Response, ok
from glossary import service
from glossary.dto import CreateGlossaryTermRequest, GlossaryTermResponse, UpdateGlossaryTermRequest
from middleware import auth

router = APIRouter(prefix="/projects/{project_id}/glossary", tags=["glossary"])


@router.get("")
async def list_glossary(request: Request, project_id: UUID) -> Response:
    user_id = auth.get_user_id(request)
    terms = await service.get_project_glossary(project_id, user_id)
    return ok(data=[GlossaryTermResponse.model_validate(t).model_dump(mode="json") for t in terms])


@router.post("")
async def create_term(request: Request, project_id: UUID, body: CreateGlossaryTermRequest) -> Response:
    user_id = auth.get_user_id(request)
    term = await service.create_term(project_id, body, user_id)
    return ok(data=GlossaryTermResponse.model_validate(term).model_dump(mode="json"))


@router.put("/{term_id}")
async def update_term(request: Request, project_id: UUID, term_id: UUID, body: UpdateGlossaryTermRequest) -> Response:
    user_id = auth.get_user_id(request)
    term = await service.update_term(project_id, term_id, body.translated_term, user_id)
    return ok(data=GlossaryTermResponse.model_validate(term).model_dump(mode="json"))
