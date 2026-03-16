import re
from collections.abc import Awaitable, Callable
from functools import cache
from typing import Any, NoReturn
from uuid import UUID

from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from jwt import PyJWT, PyJWTError

from common import erri, resp
from conf.config import settings


@cache
def _jwt() -> PyJWT:
    return PyJWT()


DEBUG_EXEMPT_PATHS = {
    "/docs",  # Swagger UI
    "/redoc",  # ReDoc
    "/openapi.json",  # OpenAPI schema
}

EXEMPT_PATHS: set[str] = {"/api/v1", "/api/v1/", "/health", "/ready", "/acps/rpc", "/.well-known/acs.json"}
EXEMPT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"^/api/v1/auth/[^/]+/authorize$"),
    re.compile(r"^/api/v1/auth/[^/]+/callback$"),
    re.compile(r"^/ws/"),  # WebSocket endpoints handle their own auth
]
_EXEMPT_ENDPOINT_ATTR = "__jwt_exempt__"
_ROUTES_FROZEN_ATTR = "__jwt_routes_frozen__"
_SETUP_ATTR = "__jwt_middleware_installed__"


def exempt[TFunc: Callable[..., Any]](fn: TFunc) -> TFunc:
    setattr(fn, _EXEMPT_ENDPOINT_ATTR, True)
    return fn


def _path_to_regex(path: str) -> re.Pattern[str]:
    """Convert a path template like /auth/{provider}/callback to a regex."""
    pattern = re.sub(r"\{[^}]+\}", r"[^/]+", path)
    return re.compile(f"^{pattern}$")


def _build_exempt_paths(app: FastAPI) -> set[str]:
    paths: set[str] = set()
    for route in list(app.router.routes):
        if not isinstance(route, APIRoute):
            continue
        if getattr(route.endpoint, _EXEMPT_ENDPOINT_ATTR, False):
            if "{" in route.path:
                EXEMPT_PATTERNS.append(_path_to_regex(route.path))
            else:
                paths.add(route.path)
    return paths


def _freeze_route_registration(app: FastAPI) -> None:
    if getattr(app, _ROUTES_FROZEN_ATTR, False):
        return

    setattr(app, _ROUTES_FROZEN_ATTR, True)

    def _blocked(*_: object, **__: object) -> NoReturn:
        raise RuntimeError("Routes are frozen. Register all routes before setup_jwt_middleware.")

    app.include_router = _blocked
    app.add_api_route = _blocked
    app.add_route = _blocked
    app.mount = _blocked
    app.router.include_router = _blocked
    app.router.add_api_route = _blocked


def verify_token(token: str) -> dict[str, Any]:
    """Verify a JWT token and return the payload."""
    try:
        decoded: dict[str, Any] = _jwt().decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return decoded
    except PyJWTError:
        raise erri.unauthorized("Invalid token") from None


def get_user_id(request: Request) -> UUID:
    """Get the user_id (UUID) from request state, set by JWT middleware.

    Zero DB lookup — the user_id comes directly from the JWT ``sub`` claim.
    """
    uid = getattr(request.state, "user_id", None)
    if isinstance(uid, UUID):
        return uid

    # Fallback: parse from Authorization header (no middleware path)
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = verify_token(token)
        sub = payload.get("sub")
        if isinstance(sub, str) and sub:
            try:
                return UUID(sub)
            except ValueError:
                raise erri.unauthorized("Invalid token: sub is not a valid UUID") from None

    raise erri.unauthorized("Unauthorized")


def get_tenant_id(request: Request) -> UUID | None:
    """Read the optional ``X-Tenant-ID`` header.

    Returns None when the header is absent (e.g. SSO users without a tenant).
    """
    raw = request.headers.get("X-Tenant-ID")
    if not raw:
        return None
    try:
        return UUID(raw)
    except ValueError:
        raise erri.bad_request("Invalid X-Tenant-ID header") from None


def get_username(request: Request) -> str:
    """Get the username from request state (set by JWT middleware ``username`` claim)."""
    state_username = getattr(request.state, "username", None)
    if isinstance(state_username, str) and state_username:
        return state_username

    # Fallback: parse from Authorization header (no middleware path)
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        payload = verify_token(token)
        username = payload.get("username")
        if isinstance(username, str) and username:
            return username

    raise erri.unauthorized("Unauthorized")


def setup_auth_middleware(app: FastAPI) -> None:
    """Setup JWT authentication middleware."""
    if getattr(app, _SETUP_ATTR, False):
        return

    EXEMPT_PATHS.update(DEBUG_EXEMPT_PATHS if settings.debug else set())
    EXEMPT_PATHS.update(_build_exempt_paths(app))
    _freeze_route_registration(app)
    setattr(app, _SETUP_ATTR, True)

    @app.middleware("http")
    async def jwt_middleware(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        path = request.url.path
        if path in EXEMPT_PATHS or any(p.match(path) for p in EXEMPT_PATTERNS):
            return await call_next(request)

        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content=resp.error(resp.Code.UNAUTHORIZED, "Unauthorized").model_dump(),
            )
        token = auth.split(" ", 1)[1]
        try:
            payload = verify_token(token)
        except erri.BusinessError as e:
            return JSONResponse(status_code=e.status_code, content=resp.error(e.code, e.message).model_dump())

        # Parse sub as UUID — old username-based tokens get clean 401
        sub = payload.get("sub")
        if not isinstance(sub, str) or not sub:
            return JSONResponse(
                status_code=401,
                content=resp.error(resp.Code.UNAUTHORIZED, "Invalid token: missing sub").model_dump(),
            )
        try:
            user_id = UUID(sub)
        except ValueError:
            return JSONResponse(
                status_code=401,
                content=resp.error(resp.Code.UNAUTHORIZED, "Invalid token: sub is not a valid UUID").model_dump(),
            )

        request.state.user_id = user_id
        request.state.username = payload.get("username", "")
        return await call_next(request)
