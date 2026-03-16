import re
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from auth.dto import TokenPair
from auth.service import create_token, revoke_all_for_user
from common import erri
from common.utils import get_password_hash, validate_password, verify_password
from user.model import User, get_user, get_user_by_id, update_user_password, update_user_profile

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9_-]{3,30}$")


async def get_user_profile(username: str) -> User:
    user = await get_user(username)
    if not user:
        raise erri.not_found("User not found")
    return user


async def get_user_profile_by_id(user_id: UUID) -> User:
    user = await get_user_by_id(user_id)
    if not user:
        raise erri.not_found("User not found")
    return user


async def update_my_profile(
    user_id: UUID, *, new_username: str | None = None, avatar_url: str | None = None
) -> tuple[User, TokenPair | None]:
    token_pair: TokenPair | None = None

    user = await get_user_by_id(user_id)
    if not user:
        raise erri.not_found("User not found")

    if new_username is not None:
        if not _USERNAME_RE.match(new_username):
            raise erri.bad_request("Username must be 3-30 chars: letters, digits, underscore, hyphen")
        if await get_user(new_username):
            raise erri.conflict("Username already taken")

    try:
        updated = await update_user_profile(user.username, new_username=new_username, avatar_url=avatar_url)
    except IntegrityError:
        raise erri.conflict("Username already taken") from None
    if not updated:
        raise erri.not_found("User not found")

    if new_username is not None and updated.id is not None:
        revoke_all_for_user(updated.id)
        token_pair = create_token(updated)

    return updated, token_pair


async def change_password(user_id: UUID, old_password: str, new_password: str) -> bool:
    user = await get_user_by_id(user_id)
    if not user:
        raise erri.not_found("User not found")

    if not verify_password(old_password, user.hashed_password):
        raise erri.bad_request("Invalid old password")

    validate_password(new_password)
    encrypted_new = get_password_hash(new_password)
    result = await update_user_password(user.username, encrypted_new)

    if result and user.id is not None:
        revoke_all_for_user(user.id)

    return result
