from fastapi.testclient import TestClient

from app.main import app


def test_admin_comments_requires_session() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/comments")
    assert response.status_code in {401, 403}


def test_admin_knowledge_base_requires_session() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/admin/knowledge-base")
    assert response.status_code in {401, 403}
