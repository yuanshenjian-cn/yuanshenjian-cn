from __future__ import annotations

from datetime import date

from app.contexts.ai_assistant.domain.daily_budget_repository import DailyBudgetRepository, DailyBudgetUsage
from app.contexts.ai_assistant.infra.dao.daily_budget_usage_dao import DailyBudgetUsageDAO


class SQLModelDailyBudgetRepository(DailyBudgetRepository):
    def __init__(self, dao: DailyBudgetUsageDAO) -> None:
        self._dao = dao

    async def reserve(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
        request_limit: int,
        token_limit: int,
    ) -> DailyBudgetUsage | None:
        return await self._dao.reserve(
            budget_key,
            usage_date,
            delta_requests,
            delta_tokens,
            request_limit,
            token_limit,
        )

    async def add_usage(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
    ) -> DailyBudgetUsage:
        return await self._dao.add_usage(budget_key, usage_date, delta_requests, delta_tokens)
