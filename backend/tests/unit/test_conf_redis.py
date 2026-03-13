from unittest.mock import MagicMock, patch

import pytest

from conf import redis as redis_module
from conf.redis import close_redis, get_async_redis, get_redis


def test_get_redis_creates_sync_client(monkeypatch):
    monkeypatch.setattr(redis_module, "_sync_client", None)
    mock_cls = MagicMock()
    mock_instance = MagicMock()
    mock_cls.return_value = mock_instance

    with patch("conf.redis.sync_redis.Redis", mock_cls):
        result = get_redis()

    assert result is mock_instance
    mock_cls.assert_called_once()
    monkeypatch.setattr(redis_module, "_sync_client", None)


def test_get_redis_returns_existing_sync_client(monkeypatch):
    existing = MagicMock()
    monkeypatch.setattr(redis_module, "_sync_client", existing)

    result = get_redis()

    assert result is existing
    monkeypatch.setattr(redis_module, "_sync_client", None)


def test_get_async_redis_creates_client(monkeypatch):
    monkeypatch.setattr(redis_module, "_async_client", None)
    mock_cls = MagicMock()
    mock_instance = MagicMock()
    mock_cls.return_value = mock_instance

    with patch("conf.redis.aioredis.Redis", mock_cls):
        result = get_async_redis()

    assert result is mock_instance
    monkeypatch.setattr(redis_module, "_async_client", None)


@pytest.mark.asyncio
async def test_close_redis_closes_sync(monkeypatch):
    mock_sync = MagicMock()
    monkeypatch.setattr(redis_module, "_sync_client", mock_sync)
    monkeypatch.setattr(redis_module, "_async_client", None)

    await close_redis()

    mock_sync.close.assert_called_once()
    assert redis_module._sync_client is None


@pytest.mark.asyncio
async def test_close_redis_noop_when_none(monkeypatch):
    monkeypatch.setattr(redis_module, "_sync_client", None)
    monkeypatch.setattr(redis_module, "_async_client", None)

    await close_redis()  # should not raise
