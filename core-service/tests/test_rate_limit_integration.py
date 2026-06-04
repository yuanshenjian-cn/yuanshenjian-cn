from __future__ import annotations

from fastapi.testclient import TestClient

from app.contexts.ai_assistant.interface import ai_assistant_chat_router
from app.contexts.article_analytics.interface import article_view_router
from app.main import app


def test_ai_turnstile_failure_only_consumes_pre_auth_bucket(monkeypatch) -> None:
    pre_auth_hits: list[str] = []
    business_hits: list[str] = []

    class StubPreAuthGuard:
        async def enforce(self, policy_key, subject):  # type: ignore[no-untyped-def]
            del subject
            pre_auth_hits.append(policy_key)

    class StubBusinessGuard:
        async def enforce(self, policy_key, subject):  # type: ignore[no-untyped-def]
            del subject
            business_hits.append(policy_key)

    async def reject_turnstile(*args, **kwargs):  # type: ignore[no-untyped-def]
        return False

    monkeypatch.setattr(ai_assistant_chat_router, "verify_origin", lambda origin, allowed: None)
    monkeypatch.setattr(ai_assistant_chat_router, "verify_turnstile", reject_turnstile)
    monkeypatch.setattr(ai_assistant_chat_router, "PreAuthRateLimitGuard", StubPreAuthGuard)
    monkeypatch.setattr(ai_assistant_chat_router, "RateLimitGuard", StubBusinessGuard)

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/ai-assistant/chat/stream",
            json={
                "scene": "article_recommendation",
                "message": "推荐两篇文章",
                "cf_turnstile_response": "bad-token",
            },
        )

    assert response.status_code == 403
    assert pre_auth_hits == ["ai_chat"]
    assert business_hits == []


def test_article_view_dedup_prevents_fast_repeat_pv(monkeypatch) -> None:
    class StubViewDeduplicator:
        def __init__(self) -> None:
            self.count = 0

        async def should_count(self, article_slug, subject):  # type: ignore[no-untyped-def]
            del article_slug, subject
            self.count += 1
            return self.count == 1

    view_deduplicator = StubViewDeduplicator()
    app.dependency_overrides[article_view_router.get_view_deduplicator] = lambda: view_deduplicator
    monkeypatch.setattr(article_view_router, "verify_origin", lambda origin, allowed: None)
    try:
        with TestClient(app) as client:
            article_slug = "rate-limit-dedup-20260604"
            first = client.post(
                f"/api/v1/articles/{article_slug}/view",
                json={"referrer": "https://yuanshenjian.cn"},
            )
            second = client.post(
                f"/api/v1/articles/{article_slug}/view",
                json={"referrer": "https://yuanshenjian.cn"},
            )
    finally:
        app.dependency_overrides.pop(article_view_router.get_view_deduplicator, None)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["pv"] == second.json()["pv"]
