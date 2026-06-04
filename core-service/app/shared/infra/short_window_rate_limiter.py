from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    remaining: int | None
    reset_at: datetime | None
    backend: str


class ShortWindowRateLimiter(Protocol):
    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision: ...
