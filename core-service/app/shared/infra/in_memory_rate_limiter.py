from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta


@dataclass
class InMemoryRateLimiter:
    limit: int
    window_seconds: int = 60
    buckets: dict[str, tuple[int, datetime]] = field(default_factory=dict)

    def hit(self, bucket_key: str) -> bool:
        now = datetime.now(UTC)
        count, reset_at = self.buckets.get(bucket_key, (0, now + timedelta(seconds=self.window_seconds)))
        if now >= reset_at:
            count = 0
            reset_at = now + timedelta(seconds=self.window_seconds)
        if count >= self.limit:
            self.buckets[bucket_key] = (count, reset_at)
            return False
        self.buckets[bucket_key] = (count + 1, reset_at)
        return True


admin_login_limiter = InMemoryRateLimiter(limit=5, window_seconds=300)
public_ai_limiter = InMemoryRateLimiter(limit=30, window_seconds=3600)
comment_limiter = InMemoryRateLimiter(limit=10, window_seconds=3600)
