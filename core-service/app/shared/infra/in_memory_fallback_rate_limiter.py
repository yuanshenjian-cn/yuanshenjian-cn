from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from app.shared.infra.short_window_rate_limiter import RateLimitDecision


@dataclass
class InMemoryFallbackRateLimiter:
    buckets: dict[str, tuple[int, datetime]] = field(default_factory=dict)

    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision:
        now = datetime.now(UTC)
        normalized_windows = sorted(windows, key=lambda item: item[1])
        bucket_values: list[tuple[str, int, datetime, int]] = []
        for limit, window_seconds in normalized_windows:
            bucket_key = f"{policy_key}:{subject_key}:{window_seconds}"
            count, reset_at = self.buckets.get(bucket_key, (0, now + timedelta(seconds=window_seconds)))
            if now >= reset_at:
                count = 0
                reset_at = now + timedelta(seconds=window_seconds)
            if count >= limit:
                self.buckets[bucket_key] = (count, reset_at)
                return RateLimitDecision(allowed=False, remaining=0, reset_at=reset_at, backend="memory")
            bucket_values.append((bucket_key, count, reset_at, limit))

        remaining_values: list[int] = []
        reset_at_values: list[datetime] = []
        for bucket_key, count, reset_at, limit in bucket_values:
            next_count = count + 1
            self.buckets[bucket_key] = (next_count, reset_at)
            remaining_values.append(max(limit - next_count, 0))
            reset_at_values.append(reset_at)

        return RateLimitDecision(
            allowed=True,
            remaining=min(remaining_values) if remaining_values else None,
            reset_at=min(reset_at_values) if reset_at_values else None,
            backend="memory",
        )
