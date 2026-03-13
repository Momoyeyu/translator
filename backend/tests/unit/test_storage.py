import pytest
from storage.backend import LocalStorageBackend


@pytest.fixture
def tmp_storage(tmp_path):
    return LocalStorageBackend(str(tmp_path))


@pytest.mark.asyncio
async def test_upload_and_download(tmp_storage):
    await tmp_storage.upload("test/file.txt", b"hello world", "text/plain")
    result = await tmp_storage.download("test/file.txt")
    assert result == b"hello world"


@pytest.mark.asyncio
async def test_delete(tmp_storage):
    await tmp_storage.upload("test/file.txt", b"data", "text/plain")
    await tmp_storage.delete("test/file.txt")
    with pytest.raises(FileNotFoundError):
        await tmp_storage.download("test/file.txt")


@pytest.mark.asyncio
async def test_get_url(tmp_storage):
    url = await tmp_storage.get_url("test/file.txt")
    assert "/files/test/file.txt" in url


@pytest.mark.asyncio
async def test_path_traversal_blocked(tmp_storage):
    with pytest.raises(ValueError, match="Path traversal"):
        await tmp_storage.upload("../../etc/passwd", b"data", "text/plain")
