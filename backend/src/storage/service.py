from __future__ import annotations

import hashlib
from uuid import UUID

from uuid6 import uuid7

from conf.config import settings
from storage.backend import LocalStorageBackend, StorageBackend

_backend: StorageBackend | None = None


def get_storage_backend() -> StorageBackend:
    """Singleton factory that returns a StorageBackend based on settings."""
    global _backend
    if _backend is None:
        if settings.storage_backend == "local":
            _backend = LocalStorageBackend(settings.storage_local_path)
        else:
            raise ValueError(f"Unknown storage backend: {settings.storage_backend}")
    return _backend


class StorageService:
    """High-level storage service wrapping a StorageBackend."""

    def __init__(self, backend: StorageBackend | None = None) -> None:
        self.backend = backend or get_storage_backend()

    @staticmethod
    def generate_key(tenant_id: UUID, project_id: UUID, category: str, ext: str) -> str:
        uid = uuid7()
        return f"{tenant_id}/{project_id}/{category}/{uid}.{ext}"

    @staticmethod
    def compute_hash(data: bytes) -> str:
        return hashlib.sha256(data).hexdigest()

    async def upload_file(
        self,
        tenant_id: UUID,
        project_id: UUID,
        category: str,
        data: bytes,
        content_type: str,
        ext: str,
    ) -> tuple[str, str]:
        """Upload a file and return (storage_key, content_hash)."""
        key = self.generate_key(tenant_id, project_id, category, ext)
        content_hash = self.compute_hash(data)
        await self.backend.upload(key, data, content_type)
        return key, content_hash

    async def download_file(self, key: str) -> bytes:
        return await self.backend.download(key)

    async def delete_file(self, key: str) -> None:
        await self.backend.delete(key)

    async def get_file_url(self, key: str, expires: int = 3600) -> str:
        return await self.backend.get_url(key, expires)
