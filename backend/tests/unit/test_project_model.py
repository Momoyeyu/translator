from project.model import ProjectStatus, TranslationProject


def test_project_status_enum():
    assert ProjectStatus.CREATED == "created"
    assert ProjectStatus.PLANNING == "planning"
    assert ProjectStatus.COMPLETED == "completed"
    assert ProjectStatus.FAILED == "failed"


def test_project_model_has_required_columns():
    columns = {c.name for c in TranslationProject.__table__.columns}
    required = {
        "id", "user_id", "tenant_id", "title",
        "source_language", "target_language", "status", "config",
        "created_at", "updated_at", "is_deleted", "deleted_at",
    }
    assert required.issubset(columns)
