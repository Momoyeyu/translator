import redis as sync_redis
import redis.asyncio as aioredis

from conf.config import settings

# Sync client (used by auth/service.py for token management)
_sync_client: sync_redis.Redis | None = None

# Async client (used by WebSocket, workers, event publishing)
_async_client: aioredis.Redis | None = None


def get_redis() -> sync_redis.Redis:
    """Get synchronous Redis client (for auth service compatibility)."""
    global _sync_client
    if _sync_client is None:
        _sync_client = sync_redis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=True,
        )
    return _sync_client


def get_async_redis() -> aioredis.Redis:
    """Get async Redis client (for WebSocket, workers, events)."""
    global _async_client
    if _async_client is None:
        _async_client = aioredis.Redis(
            host=settings.redis_host,
            port=settings.redis_port,
            db=settings.redis_db,
            decode_responses=False,
        )
    return _async_client


async def close_redis() -> None:
    global _sync_client, _async_client
    if _sync_client is not None:
        _sync_client.close()
        _sync_client = None
    if _async_client is not None:
        await _async_client.aclose()
        _async_client = None
