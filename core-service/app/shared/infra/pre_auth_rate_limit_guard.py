from __future__ import annotations

from dataclasses import dataclass

from app.shared.domain.request_subject import RequestSubject
from app.shared.infra.rate_limit_guard import RateLimitGuard
from app.shared.infra.short_window_rate_limiter import RateLimitDecision


@dataclass
class PreAuthRateLimitGuard:
    guard: RateLimitGuard | None = None

    async def enforce(self, policy_key: str, subject: RequestSubject) -> RateLimitDecision:
        active_guard = self.guard or RateLimitGuard()
        return await active_guard._enforce_subject(f"{policy_key}_pre_auth", f"ip:{subject.ip_hash}")
