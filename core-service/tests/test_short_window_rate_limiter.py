from __future__ import annotations

import asyncio
from collections.abc import Sequence

from app.shared.domain.request_subject import RequestSubject
from app.shared.infra.pre_auth_rate_limit_guard import PreAuthRateLimitGuard
from app.shared.infra.rate_limit_guard import RateLimitGuard
from app.shared.infra.render_key_value_rate_limiter import RenderKeyValueRateLimiter
from app.shared.infra.short_window_rate_limiter import RateLimitDecision


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, int] = {}
        self.expires: dict[str, int] = {}

    async def eval(self, script: str, numkeys: int, *keys_and_args: object) -> list[int]:
        del script
        keys = [str(item) for item in keys_and_args[:numkeys]]
        args = list(keys_and_args[numkeys:])
        limits = [int(str(item)) for item in args[:numkeys]]
        windows = [int(str(item)) for item in args[numkeys:]]

        for key, limit, window_seconds in zip(keys, limits, windows, strict=True):
            count = self.values.get(key, 0)
            if count >= limit:
                return [0, count, window_seconds]

        remaining_values: list[int] = []
        for key, limit, window_seconds in zip(keys, limits, windows, strict=True):
            next_count = self.values.get(key, 0) + 1
            self.values[key] = next_count
            self.expires.setdefault(key, window_seconds)
            remaining_values.append(limit - next_count)
        return [1, min(remaining_values), min(windows)]

    async def get(self, key: str) -> str | None:
        value = self.values.get(key)
        if value is None:
            return None
        return str(value)

    def keys(self) -> Sequence[str]:
        return tuple(self.values.keys())


def test_check_and_hit_many_rejects_without_polluting_any_window() -> None:
    async def run() -> None:
        fake_redis = FakeRedis()
        limiter = RenderKeyValueRateLimiter(fake_redis)

        allowed = await limiter.check_and_hit_many("ai_chat", "ip:1", [(1, 60)])
        rejected = await limiter.check_and_hit_many("ai_chat", "ip:1", [(1, 60), (10, 600)])

        assert allowed.allowed is True
        assert rejected.allowed is False
        assert await fake_redis.get("rl:ai_chat:ip:1:600") is None

    asyncio.run(run())


def test_check_and_hit_many_hits_all_windows_when_allowed() -> None:
    async def run() -> None:
        fake_redis = FakeRedis()
        limiter = RenderKeyValueRateLimiter(fake_redis)

        decision = await limiter.check_and_hit_many("comment_submit", "visitor:1", [(3, 60), (10, 600)])

        assert decision.allowed is True
        assert decision.remaining == 2
        assert await fake_redis.get("rl:comment_submit:visitor:1:60") == "1"
        assert await fake_redis.get("rl:comment_submit:visitor:1:600") == "1"

    asyncio.run(run())


class CapturingLimiter:
    def __init__(self) -> None:
        self.hits: list[tuple[str, str, list[tuple[int, int]]]] = []

    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision:
        self.hits.append((policy_key, subject_key, windows))
        return RateLimitDecision(allowed=True, remaining=1, reset_at=None, backend="test")


def test_pre_auth_guard_only_hits_ip_bucket() -> None:
    async def run() -> None:
        limiter = CapturingLimiter()
        guard = PreAuthRateLimitGuard(RateLimitGuard(limiter=limiter, policies={"ai_chat_pre_auth": [(1, 60)]}))
        subject = RequestSubject("1.2.3.4", "iph", "uah", "visitor", "vh", "valid")

        await guard.enforce("ai_chat", subject)

        assert limiter.hits == [("ai_chat_pre_auth", "ip:iph", [(1, 60)])]

    asyncio.run(run())


def test_business_guard_hits_ip_and_visitor_buckets() -> None:
    async def run() -> None:
        limiter = CapturingLimiter()
        guard = RateLimitGuard(limiter=limiter, policies={"comment_submit": [(2, 60)]})
        subject = RequestSubject("1.2.3.4", "iph", "uah", "visitor", "vh", "valid")

        await guard.enforce("comment_submit", subject)

        assert limiter.hits == [
            ("comment_submit", "ip:iph", [(2, 60)]),
            ("comment_submit", "visitor:vh", [(2, 60)]),
        ]

    asyncio.run(run())
