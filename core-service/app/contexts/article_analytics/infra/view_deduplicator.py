from __future__ import annotations

from dataclasses import dataclass, field

from app.shared.domain.request_subject import RequestSubject
from app.shared.infra.in_memory_fallback_rate_limiter import InMemoryFallbackRateLimiter
from app.shared.infra.rate_limit_guard import RATE_LIMIT_POLICIES, get_default_short_window_rate_limiter
from app.shared.infra.short_window_rate_limiter import ShortWindowRateLimiter

_view_dedupe_fallback_limiter = InMemoryFallbackRateLimiter()


@dataclass
class ViewDeduplicator:
    limiter: ShortWindowRateLimiter | None = None
    fallback_limiter: ShortWindowRateLimiter = field(default_factory=lambda: _view_dedupe_fallback_limiter)

    async def should_count(self, article_slug: str, subject: RequestSubject) -> bool:
        subject_key = subject.visitor_key_hash or subject.ip_hash
        limiter = self.limiter or get_default_short_window_rate_limiter()
        try:
            decision = await limiter.check_and_hit_many(
                "article_view",
                f"article:{article_slug}:subject:{subject_key}",
                RATE_LIMIT_POLICIES["article_view"],
            )
        except Exception:
            decision = await self.fallback_limiter.check_and_hit_many(
                "article_view",
                f"article:{article_slug}:subject:{subject_key}",
                RATE_LIMIT_POLICIES["article_view"],
            )
        return decision.allowed
