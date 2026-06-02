from __future__ import annotations

from fastapi.testclient import TestClient

from app.contexts.admin_console.interface import admin_auth_router
from app.contexts.admin_console.application import login_admin_session_app_service
from app.contexts.comment.interface import admin_comment_moderation_router, article_comment_router
from app.main import app


def test_comment_submission_review_and_public_visibility(monkeypatch) -> None:
    async def _verify_turnstile(*args, **kwargs):
        return True

    monkeypatch.setattr(article_comment_router, "verify_origin", lambda origin, allowed: None)
    monkeypatch.setattr(article_comment_router.comment_limiter, "hit", lambda bucket: True)
    monkeypatch.setattr(article_comment_router, "verify_turnstile", _verify_turnstile)

    monkeypatch.setattr(admin_auth_router, "verify_origin", lambda origin, allowed: None)
    monkeypatch.setattr(admin_auth_router.admin_login_limiter, "hit", lambda bucket: True)
    monkeypatch.setattr(admin_auth_router, "verify_turnstile", _verify_turnstile)
    monkeypatch.setattr(login_admin_session_app_service, "verify_admin_password", lambda password: True)

    monkeypatch.setattr(admin_comment_moderation_router, "verify_origin", lambda origin, allowed: None)

    client = TestClient(app)
    article_slug = "integration-comment-flow-20260602"

    create_response = client.post(
        f"/api/v1/articles/{article_slug}/comments",
        json={
            "display_name": "测试用户",
            "content_markdown": "这篇文章很有帮助。",
            "turnstile_token": "token",
        },
        headers={"Origin": "http://localhost:3000"},
    )
    assert create_response.status_code == 200
    comment_id = create_response.json()["id"]

    pending_public_response = client.get(f"/api/v1/articles/{article_slug}/comments")
    assert pending_public_response.status_code == 200
    assert all(item["id"] != comment_id for item in pending_public_response.json()["items"])

    login_response = client.post(
        "/api/v1/admin/auth/login",
        json={
            "password": "admin123456",
            "turnstile_token": "token",
        },
        headers={"Origin": "http://localhost:3000"},
    )
    assert login_response.status_code == 200
    csrf_token = login_response.json()["csrf_token"]

    moderation_response = client.get("/api/v1/admin/comments?status=pending")
    assert moderation_response.status_code == 200
    assert any(item["id"] == comment_id for item in moderation_response.json()["items"])

    approve_response = client.post(
        f"/api/v1/admin/comments/{comment_id}/approve",
        json={"review_note": "通过", "csrf_token": csrf_token},
        headers={"Origin": "http://localhost:3000", "X-CSRF-Token": csrf_token},
    )
    assert approve_response.status_code == 200
    assert approve_response.json()["status"] == "approved"

    public_response = client.get(f"/api/v1/articles/{article_slug}/comments")
    assert public_response.status_code == 200
    items = public_response.json()["items"]
    approved_item = next(item for item in items if item["id"] == comment_id)
    assert approved_item["display_name"] == "测试用户"
