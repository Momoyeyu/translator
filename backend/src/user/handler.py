from fastapi import APIRouter, Request

from common.resp import Response, ok
from middleware import auth
from user import dto, service

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/whoami")
async def whoami(request: Request) -> Response:
    username = auth.get_username(request)
    return ok(data=dto.UserWhoAmIResponse(username=username).model_dump())


@router.get("/me")
async def get_me(request: Request) -> Response:
    user_id = auth.get_user_id(request)
    user = await service.get_user_profile_by_id(user_id)
    return ok(
        data=dto.UserProfileResponse(
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
        ).model_dump(exclude_none=True)
    )


@router.post("/me")
async def update_me(request: Request, body: dto.UserProfileUpdateRequest) -> Response:
    user_id = auth.get_user_id(request)
    user, token_pair = await service.update_my_profile(
        user_id,
        new_username=body.username,
        avatar_url=body.avatar_url,
    )
    data = dto.UserProfileResponse(
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        access_token=token_pair.access_token if token_pair else None,
        refresh_token=token_pair.refresh_token if token_pair else None,
    )
    return ok(data=data.model_dump(exclude_none=True))


@router.post("/password/change")
async def change_password(request: Request, body: dto.PasswordChangeRequest) -> Response:
    user_id = auth.get_user_id(request)
    await service.change_password(user_id, body.old_password, body.new_password)
    return ok(message="Password changed successfully")
