from uuid import UUID

import pytest
from fastapi import APIRouter, FastAPI, Request
from fastapi.testclient import TestClient

from auth import service as auth_service
from common.resp import Code
from middleware import auth
from user import handler as user_handler
from user.model import User

_ALICE_ID = UUID("01936b2a-7c00-7000-8000-000000000001")
_BOB_ID = UUID("01936b2a-7c00-7000-8000-000000000002")


def test_jwt_middleware_returns_unauthorized_when_missing_authorization_header():
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/protected")
    async def protected():
        return {"ok": True}

    auth.setup_auth_middleware(app)
    client = TestClient(app)
    resp = client.get("/protected")
    assert resp.status_code == 401
    assert resp.json()["code"] == Code.UNAUTHORIZED


def test_jwt_middleware_returns_unauthorized_when_token_invalid():
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/protected")
    async def protected():
        return {"ok": True}

    auth.setup_auth_middleware(app)
    client = TestClient(app)
    resp = client.get("/protected", headers={"Authorization": "Bearer not-a-jwt"})
    assert resp.status_code == 401
    assert resp.json()["code"] == Code.UNAUTHORIZED


def test_jwt_middleware_allows_exempt_route_without_authorization_header():
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @auth.exempt
    @app.get("/public")
    async def public():
        return {"ok": True}

    auth.setup_auth_middleware(app)
    client = TestClient(app)
    resp = client.get("/public")
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


def test_jwt_middleware_allows_exempt_route_with_router_prefix():
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    router = APIRouter(prefix="/user")

    @auth.exempt
    @router.get("/ping")
    async def ping():
        return {"pong": True}

    app.include_router(router)
    auth.setup_auth_middleware(app)
    client = TestClient(app)
    resp = client.get("/user/ping")
    assert resp.status_code == 200
    assert resp.json() == {"pong": True}


def test_setup_jwt_middleware_freezes_route_registration():
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    auth.setup_auth_middleware(app)

    with pytest.raises(RuntimeError):

        @app.get("/late")
        async def late():
            return {"ok": True}


def test_get_username_returns_username_from_request_state_when_middleware_installed(
    monkeypatch: pytest.MonkeyPatch,
):
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/me")
    async def me(request: Request):
        return {"username": auth.get_username(request)}

    auth.setup_auth_middleware(app)
    client = TestClient(app)

    # Mock refresh token creation (now returns a string)
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)

    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get("/me", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert resp.json() == {"username": "alice"}


def test_get_username_can_parse_username_from_authorization_header_without_middleware(
    monkeypatch: pytest.MonkeyPatch,
):
    app = FastAPI()

    @app.get("/me")
    async def me(request: Request):
        return {"username": auth.get_username(request)}

    client = TestClient(app)

    # Mock refresh token creation (now returns a string)
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)

    token_pair = auth_service.create_token(User(id=_BOB_ID, username="bob", hashed_password="x"))
    resp = client.get("/me", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert resp.json() == {"username": "bob"}


def test_user_whoami_returns_username_from_token(monkeypatch: pytest.MonkeyPatch):
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()
    app.include_router(user_handler.router)
    auth.setup_auth_middleware(app)
    client = TestClient(app)

    # Mock refresh token creation (now returns a string)
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)

    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get("/user/whoami", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert resp.json()["code"] == Code.OK
    assert resp.json()["data"]["username"] == "alice"


def test_user_me_uses_get_user_id_to_fetch_profile(monkeypatch: pytest.MonkeyPatch):
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()
    app.include_router(user_handler.router)
    auth.setup_auth_middleware(app)
    client = TestClient(app)

    captured: dict[str, UUID] = {}

    async def _get_user_profile_by_id(user_id: UUID) -> User:
        captured["user_id"] = user_id
        return User(
            id=user_id,
            username="alice",
            hashed_password="x",
            email="alice@example.com",
            avatar_url="https://example.com/a.png",
            is_active=True,
        )

    monkeypatch.setattr(user_handler.service, "get_user_profile_by_id", _get_user_profile_by_id, raising=True)

    # Mock refresh token creation (now returns a string)
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)

    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get("/user/me", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert captured["user_id"] == _ALICE_ID
    assert resp.json()["data"]["username"] == "alice"


def test_jwt_middleware_allows_sso_parameterized_exempt_routes():
    """SSO authorize/callback endpoints use path parameters ({provider}) and must
    be exempt from JWT authentication regardless of whether the SSO router is registered."""
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    api_router = APIRouter(prefix="/api/v1")
    sso_router = APIRouter(prefix="/auth", tags=["auth-sso"])

    @auth.exempt
    @sso_router.get("/{provider}/authorize")
    async def sso_authorize(provider: str):
        return {"url": f"https://example.com/{provider}"}

    @auth.exempt
    @sso_router.get("/{provider}/callback")
    async def sso_callback(provider: str, code: str = "", state: str = ""):
        return {"ok": True}

    api_router.include_router(sso_router)
    app.include_router(api_router)
    auth.setup_auth_middleware(app)

    client = TestClient(app)
    # Both providers should pass through without a token
    resp_gh = client.get("/api/v1/auth/github/authorize")
    assert resp_gh.status_code == 200

    resp_gg = client.get("/api/v1/auth/google/authorize")
    assert resp_gg.status_code == 200

    resp_cb = client.get("/api/v1/auth/github/callback?code=abc&state=xyz")
    assert resp_cb.status_code == 200


def test_user_me_post_updates_profile(monkeypatch: pytest.MonkeyPatch):
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()
    app.include_router(user_handler.router)
    auth.setup_auth_middleware(app)
    client = TestClient(app)

    async def _update_my_profile(user_id: UUID, *, new_username=None, avatar_url=None):
        return (
            User(
                id=user_id,
                username=new_username or "alice",
                hashed_password="x",
                email="alice@test.com",
                avatar_url=avatar_url,
                is_active=True,
            ),
            None,
        )

    monkeypatch.setattr(user_handler.service, "update_my_profile", _update_my_profile, raising=True)

    # Mock refresh token creation (now returns a string)
    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)

    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x", email="alice@test.com"))
    resp = client.post(
        "/user/me",
        headers={"Authorization": f"Bearer {token_pair.access_token}"},
        json={"avatar_url": "https://example.com/new.png"},
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["username"] == "alice"
    assert resp.json()["data"]["avatar_url"] == "https://example.com/new.png"


# ---------------------------------------------------------------------------
# New tests for get_user_id, get_tenant_id, old-token rejection
# ---------------------------------------------------------------------------


def test_get_user_id_returns_uuid(monkeypatch: pytest.MonkeyPatch):
    """get_user_id() should return the UUID from request.state.user_id set by middleware."""
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/uid")
    async def uid(request: Request):
        return {"user_id": str(auth.get_user_id(request))}

    auth.setup_auth_middleware(app)
    client = TestClient(app)

    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)
    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get("/uid", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert resp.json()["user_id"] == str(_ALICE_ID)


def test_get_tenant_id_returns_none_when_absent(monkeypatch: pytest.MonkeyPatch):
    """get_tenant_id() should return None when X-Tenant-ID header is not sent."""
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/tid")
    async def tid(request: Request):
        tenant_id = auth.get_tenant_id(request)
        return {"tenant_id": str(tenant_id) if tenant_id else None}

    auth.setup_auth_middleware(app)
    client = TestClient(app)

    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)
    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get("/tid", headers={"Authorization": f"Bearer {token_pair.access_token}"})
    assert resp.status_code == 200
    assert resp.json()["tenant_id"] is None


def test_get_tenant_id_returns_uuid_when_present(monkeypatch: pytest.MonkeyPatch):
    """get_tenant_id() should return the UUID from X-Tenant-ID header."""
    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    tenant_uuid = UUID("01936b2a-7c00-7000-8000-000000000099")

    @app.get("/tid")
    async def tid(request: Request):
        tenant_id = auth.get_tenant_id(request)
        return {"tenant_id": str(tenant_id) if tenant_id else None}

    auth.setup_auth_middleware(app)
    client = TestClient(app)

    monkeypatch.setattr(auth_service, "create_refresh_token", lambda uid, uname: "mock-refresh", raising=True)
    token_pair = auth_service.create_token(User(id=_ALICE_ID, username="alice", hashed_password="x"))
    resp = client.get(
        "/tid",
        headers={
            "Authorization": f"Bearer {token_pair.access_token}",
            "X-Tenant-ID": str(tenant_uuid),
        },
    )
    assert resp.status_code == 200
    assert resp.json()["tenant_id"] == str(tenant_uuid)


def test_old_username_token_gets_401():
    """A JWT with sub=username (not UUID) should get a clean 401 from middleware."""
    import time

    from jwt import PyJWT

    from conf.config import settings

    auth.EXEMPT_PATHS.clear()
    app = FastAPI()

    @app.get("/protected")
    async def protected():
        return {"ok": True}

    auth.setup_auth_middleware(app)
    client = TestClient(app)

    # Create an old-style token with sub=username (not a UUID)
    now = int(time.time())
    payload = {"sub": "alice", "iat": now, "exp": now + 3600}
    old_token = PyJWT().encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    resp = client.get("/protected", headers={"Authorization": f"Bearer {old_token}"})
    assert resp.status_code == 401
    assert resp.json()["code"] == Code.UNAUTHORIZED
