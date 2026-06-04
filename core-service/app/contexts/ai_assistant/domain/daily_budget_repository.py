from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Protocol


@dataclass(frozen=True)
class DailyBudgetUsage:
    usage_date: date
    budget_key: str
    request_count: int
    token_count: int


class DailyBudgetRepository(Protocol):
    async def reserve(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
        request_limit: int,
        token_limit: int,
    ) -> DailyBudgetUsage | None: ...

    async def add_usage(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
    ) -> DailyBudgetUsage: ...
