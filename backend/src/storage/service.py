from __future__ import annotations

import hashlib

from uuid6 import uuid7

from conf.config import settings
from storage.backend import LocalStorageBackend, StorageBackend

_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    """Singleton factory that returns a StorageBackend based on settings."""
    global _backend
    if _backend is None:
        if settings.storage_backend == "local":
            base_path = settings.storage_local_path
            _backend = LocalStorageBackend(base_path)
        else:
            raise ValueError(f"Unknown storage backend: {settings.storage_backend}")
    return _backend


class StorageService:
    """High-level storage service wrapping a StorageBackend."""

    def __init__(self, backend: StorageBackend | None = None) -> None:
        self.backend = backend or get_storage_backend()

    @staticmethod
    def generate_key(tenant_id: str, project_id: str, category: str, ext: str) -> str:
        """Generate a unique storage key using uuid7."""
        uid = uuid7()
        return f"{tenant_id}/{project_id}/{category}/{uid}{ext}"

    @staticmethod
    def compute_hash(data: bytes) -> str:
        """Compute SHA-256 hash of data."""
        return hashlib.sha256(data).hexdigest()

    async def upload_file(self, key: str, data: bytes, content_type: str) -> str:
        """Upload a file and return its key."""
        return await self.backend.upload(key, data, content_type)

    async def download_file(self, key: str) -> bytes:
        """Download a file by key."""
        return await self.backend.download(key)

    async def delete_file(self, key: str) -> None:
        """Delete a file by key."""
        await self.backend.delete(key)

    async def get_file_url(self, key: str, expires: int = 3600) -> str:
        """Get a URL for a file."""
        return await self.backend.get_url(key, expires)
