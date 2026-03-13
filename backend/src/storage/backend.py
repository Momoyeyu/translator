from __future__ import annotations

import os
from abc import ABC, abstractmethod

import aiofiles
import aiofiles.os


class StorageBackend(ABC):
    """Abstract base class for file storage backends."""

    @abstractmethod
    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        """Upload data and return the storage key."""

    @abstractmethod
    async def download(self, key: str) -> bytes:
        """Download data by key."""

    @abstractmethod
    async def delete(self, key: str) -> None:
        """Delete data by key."""

    @abstractmethod
    async def get_url(self, key: str, expires: int = 3600) -> str:
        """Return a URL for accessing the file."""


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend using aiofiles."""

    def __init__(self, base_path: str) -> None:
        self.base_path = os.path.abspath(base_path)

    def _safe_path(self, key: str) -> str:
        """Resolve the full path and prevent path traversal."""
        full = os.path.abspath(os.path.join(self.base_path, key))
        if not full.startswith(self.base_path + os.sep) and full != self.base_path:
            raise ValueError("Path traversal detected")
        return full

    async def upload(self, key: str, data: bytes, content_type: str) -> str:
        path = self._safe_path(key)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        async with aiofiles.open(path, "wb") as f:
            await f.write(data)
        return key

    async def download(self, key: str) -> bytes:
        path = self._safe_path(key)
        if not os.path.exists(path):
            raise FileNotFoundError(f"File not found: {key}")
        async with aiofiles.open(path, "rb") as f:
            return await f.read()

    async def delete(self, key: str) -> None:
        path = self._safe_path(key)
        if os.path.exists(path):
            await aiofiles.os.remove(path)

    async def get_url(self, key: str, expires: int = 3600) -> str:
        return f"/files/{key}"
