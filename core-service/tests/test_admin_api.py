from fastapi.testclient import TestClient

from app.main import app


def test_admin_comments_requires_session() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/admin/comments")
    assert response.status_code in {401, 403}
