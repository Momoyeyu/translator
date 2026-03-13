"""Integration tests for the Project API (CRUD with multipart upload)."""

import io

import pytest
from fastapi.testclient import TestClient

from common.resp import Code
from conf import config as config_module
from document import model as document_model
from project import model as project_model
from project import service as project_service
from storage import service as storage_service_module


@pytest.fixture(autouse=True)
def patch_project_models(monkeypatch, test_session_local, test_engine):
    """Patch AsyncSessionLocal in all project-related modules."""
    monkeypatch.setattr(project_model, "AsyncSessionLocal", test_session_local)
    monkeypatch.setattr(project_service, "AsyncSessionLocal", test_session_local)
    monkeypatch.setattr(document_model, "AsyncSessionLocal", test_session_local)


@pytest.fixture(autouse=True)
def patch_storage(monkeypatch, tmp_path):
    """Use a temporary directory for file storage during tests."""
    monkeypatch.setattr(config_module.settings, "storage_backend", "local")
    monkeypatch.setattr(config_module.settings, "storage_local_path", str(tmp_path))
    # Reset the storage backend singleton so it picks up the new path
    monkeypatch.setattr(storage_service_module, "_backend", None)


def _get_auth(client: TestClient, auth_header) -> dict:
    """Helper: register a user and return auth headers."""
    return auth_header("projuser@example.com", "Secret12")


class TestCreateProject:
    def test_create_project_success(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        file_data = io.BytesIO(b"Hello world, this is a test document.")
        response = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={
                "title": "Test Translation",
                "target_language": "zh",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert data["data"]["title"] == "Test Translation"
        assert data["data"]["target_language"] == "zh"
        assert data["data"]["status"] == "created"

    def test_create_project_with_source_language(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        file_data = io.BytesIO(b"Bonjour le monde.")
        response = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={
                "title": "French to Chinese",
                "target_language": "zh",
                "source_language": "fr",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert data["data"]["source_language"] == "fr"

    def test_create_project_empty_file_fails(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        file_data = io.BytesIO(b"   ")
        response = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("empty.txt", file_data, "text/plain")},
            data={
                "title": "Empty Doc",
                "target_language": "zh",
            },
        )
        assert response.status_code == 400

    def test_create_project_unauthorized(self, client: TestClient):
        file_data = io.BytesIO(b"Hello world.")
        response = client.post(
            "/api/v1/projects",
            files={"file": ("test.txt", file_data, "text/plain")},
            data={
                "title": "No Auth",
                "target_language": "zh",
            },
        )
        assert response.status_code == 401


class TestListProjects:
    def test_list_projects_empty(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        response = client.get("/api/v1/projects", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert data["data"] == []

    def test_list_projects_after_create(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        # Create a project
        file_data = io.BytesIO(b"Some text to translate.")
        client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={"title": "Listed Project", "target_language": "zh"},
        )
        response = client.get("/api/v1/projects", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Listed Project"


class TestGetProject:
    def test_get_project_by_id(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        # Create
        file_data = io.BytesIO(b"Content for get test.")
        create_resp = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={"title": "Get Me", "target_language": "ja"},
        )
        project_id = create_resp.json()["data"]["id"]

        # Get
        response = client.get(f"/api/v1/projects/{project_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert data["data"]["id"] == project_id
        assert data["data"]["title"] == "Get Me"
        assert data["data"]["target_language"] == "ja"

    def test_get_nonexistent_project(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/projects/{fake_id}", headers=headers)
        assert response.status_code == 404


class TestUpdateProject:
    def test_update_project_title(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        # Create
        file_data = io.BytesIO(b"Content for update test.")
        create_resp = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={"title": "Old Title", "target_language": "de"},
        )
        project_id = create_resp.json()["data"]["id"]

        # Update
        response = client.patch(
            f"/api/v1/projects/{project_id}",
            headers=headers,
            json={"title": "New Title"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert data["data"]["title"] == "New Title"

    def test_update_nonexistent_project(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.patch(
            f"/api/v1/projects/{fake_id}",
            headers=headers,
            json={"title": "Nope"},
        )
        assert response.status_code == 404


class TestDeleteProject:
    def test_delete_project_soft(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        # Create
        file_data = io.BytesIO(b"Content for delete test.")
        create_resp = client.post(
            "/api/v1/projects",
            headers=headers,
            files={"file": ("test.txt", file_data, "text/plain")},
            data={"title": "Delete Me", "target_language": "ko"},
        )
        project_id = create_resp.json()["data"]["id"]

        # Delete
        response = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == Code.OK
        assert "deleted" in data["message"].lower()

        # Verify it no longer shows up in list
        list_resp = client.get("/api/v1/projects", headers=headers)
        assert list_resp.status_code == 200
        projects = list_resp.json()["data"]
        assert all(p["id"] != project_id for p in projects)

        # Verify it no longer shows up by ID
        get_resp = client.get(f"/api/v1/projects/{project_id}", headers=headers)
        assert get_resp.status_code == 404

    def test_delete_nonexistent_project(self, client: TestClient, auth_header):
        headers = _get_auth(client, auth_header)
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.delete(f"/api/v1/projects/{fake_id}", headers=headers)
        assert response.status_code == 404
