from __future__ import annotations

from dataclasses import dataclass, field

from fastapi import HTTPException

from app.shared.domain.request_subject import RequestSubject
from app.shared.infra.in_memory_fallback_rate_limiter import InMemoryFallbackRateLimiter
from app.shared.infra.key_value_client import get_key_value_client
from app.shared.infra.render_key_value_rate_limiter import RenderKeyValueRateLimiter
from app.shared.infra.short_window_rate_limiter import RateLimitDecision, ShortWindowRateLimiter


RATE_LIMIT_POLICIES: dict[str, list[tuple[int, int]]] = {
    "ai_chat_pre_auth": [(20, 60), (120, 3600)],
    "ai_chat": [(10, 60), (50, 3600)],
    "ai_advisor_pre_auth": [(20, 60), (80, 3600)],
    "ai_advisor": [(6, 60), (30, 3600)],
    "comment_submit_pre_auth": [(10, 60), (60, 3600)],
    "comment_submit": [(5, 60), (10, 3600)],
    "admin_login_pre_auth": [(10, 300)],
    "admin_login": [(5, 300)],
    "article_view": [(120, 60)],
}

RATE_LIMIT_DETAILS: dict[str, str] = {
    "ai_chat": "ai_rate_limited",
    "ai_chat_pre_auth": "ai_rate_limited",
    "ai_advisor": "ai_rate_limited",
    "ai_advisor_pre_auth": "ai_rate_limited",
    "comment_submit": "comment_rate_limited",
    "comment_submit_pre_auth": "comment_rate_limited",
    "admin_login": "admin_login_rate_limited",
    "admin_login_pre_auth": "admin_login_rate_limited",
    "article_view": "article_view_rate_limited",
}

_memory_fallback_limiter = InMemoryFallbackRateLimiter()
_key_value_limiter: ShortWindowRateLimiter | None = None


def get_default_short_window_rate_limiter() -> ShortWindowRateLimiter:
    global _key_value_limiter
    client = get_key_value_client()
    if client is None:
        return _memory_fallback_limiter
    if _key_value_limiter is None:
        _key_value_limiter = RenderKeyValueRateLimiter(client)
    return _key_value_limiter


@dataclass
class RateLimitGuard:
    limiter: ShortWindowRateLimiter | None = None
    fallback_limiter: ShortWindowRateLimiter = field(default_factory=lambda: _memory_fallback_limiter)
    policies: dict[str, list[tuple[int, int]]] | None = None

    async def enforce(self, policy_key: str, subject: RequestSubject) -> list[RateLimitDecision]:
        subject_keys = [f"ip:{subject.ip_hash}"]
        if subject.visitor_key_hash:
            subject_keys.append(f"visitor:{subject.visitor_key_hash}")
        return [await self._enforce_subject(policy_key, subject_key) for subject_key in subject_keys]

    async def _enforce_subject(self, policy_key: str, subject_key: str) -> RateLimitDecision:
        windows = self._windows_for(policy_key)
        limiter = self.limiter or get_default_short_window_rate_limiter()
        try:
            decision = await limiter.check_and_hit_many(policy_key, subject_key, windows)
        except Exception:
            decision = await self.fallback_limiter.check_and_hit_many(policy_key, subject_key, windows)
        if not decision.allowed:
            raise HTTPException(status_code=429, detail=RATE_LIMIT_DETAILS.get(policy_key, "rate_limited"))
        return decision

    def _windows_for(self, policy_key: str) -> list[tuple[int, int]]:
        policies = self.policies or RATE_LIMIT_POLICIES
        windows = policies.get(policy_key)
        if not windows:
            raise RuntimeError(f"rate_limit_policy_missing:{policy_key}")
        return windows
