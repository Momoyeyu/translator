from uuid import UUID

from fastapi import APIRouter, Request

from common.resp import Response, ok
from conversation import service
from conversation.dto import MessageResponse, SendMessageRequest
from middleware import auth

router = APIRouter(prefix="/projects/{project_id}/chat", tags=["chat"])


@router.post("")
async def send_message(request: Request, project_id: UUID, body: SendMessageRequest) -> Response:
    user_id = auth.get_user_id(request)
    msg = await service.send_chat_message(project_id, user_id, body.content)
    return ok(data=MessageResponse.model_validate(msg).model_dump(mode="json"))


@router.get("/history")
async def get_history(
    request: Request,
    project_id: UUID,
    cursor: UUID | None = None,
    limit: int = 50,
) -> Response:
    user_id = auth.get_user_id(request)
    messages = await service.get_chat_history(project_id, user_id, cursor=cursor, limit=min(limit, 100))
    return ok(data=[MessageResponse.model_validate(m).model_dump(mode="json") for m in messages])
