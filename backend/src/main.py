from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from acps.handler import router as acps_router
from fastapi import APIRouter, FastAPI
from loguru import logger

from acps.handler import router as acps_router
from artifact.handler import router as artifact_router
from auth.handler import router as auth_router
from common.resp import Response, ok
from common.trap import setup_exception_handlers
from conf import logging
from conf.db import close_db
from conf.kafka import close_kafka_producer, get_kafka_producer
from conf.openapi import setup_openapi
from conf.redis import close_redis
from conversation.handler import router as chat_router
from glossary.handler import router as glossary_router
from middleware.auth import setup_auth_middleware
from middleware.logging import setup_logging_middleware
from pipeline.handler import router as pipeline_router
from project.handler import router as project_router
from tenant.handler import router as tenant_router
from user.handler import router as user_router
from ws.handler import router as ws_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Application started")
    try:
        await get_kafka_producer()
        logger.info("Kafka producer connected")
    except Exception as e:
        logger.warning(f"Kafka not available (dev mode OK): {e}")
    yield
    logger.info("Application shutdown")
    await close_kafka_producer()
    await close_redis()
    await close_db()


def init_routers(_app: FastAPI) -> None:
    @_app.get("/health")
    async def health():
        return {"status": "ok"}

    @_app.get("/ready")
    async def ready():
        return {"status": "ok"}

    api_router = APIRouter(prefix="/api/v1")

    @api_router.get("/")
    async def root() -> Response:
        return ok(message="Hello FastAPI + UV!")

    api_router.include_router(auth_router)
    api_router.include_router(user_router)
    api_router.include_router(tenant_router)
    api_router.include_router(project_router)
    api_router.include_router(pipeline_router)
    api_router.include_router(glossary_router)
    api_router.include_router(artifact_router)
    api_router.include_router(chat_router)
    _app.include_router(api_router)
    _app.include_router(ws_router)
    _app.include_router(acps_router)


def init_middlewares(_app: FastAPI) -> None:
    # Note: FastAPI middlewares execute in reverse order (last registered = first executed)
    # Order: logging -> auth -> handler
    setup_auth_middleware(_app)
    setup_logging_middleware(_app)


def create_app() -> FastAPI:
    logging.must_init()

    _app = FastAPI(
        title="Translator Agent API",
        description="ACPs-compliant translation agent backend",
        version="1.0.0",
        lifespan=lifespan,
    )

    init_routers(_app)
    init_middlewares(_app)
    setup_exception_handlers(_app)

    # Swagger Documents
    setup_openapi(_app)

    return _app


app = create_app()
