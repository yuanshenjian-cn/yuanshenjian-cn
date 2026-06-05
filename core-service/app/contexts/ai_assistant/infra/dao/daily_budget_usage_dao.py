from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.ai_assistant.domain.daily_budget_repository import DailyBudgetUsage


class DailyBudgetUsageDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def reserve(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
        request_limit: int,
        token_limit: int,
    ) -> DailyBudgetUsage | None:
        now_expression = self._now_expression()
        statement = text(
            f"""
            insert into daily_budget_usage (usage_date, budget_key, request_count, token_count, updated_at)
            select cast(:usage_date as date), cast(:budget_key as varchar(64)), cast(:delta_requests as integer), cast(:delta_tokens as integer), {now_expression}
            where cast(:delta_requests as integer) <= cast(:request_limit as integer)
              and cast(:delta_tokens as integer) <= cast(:token_limit as integer)
            on conflict (usage_date, budget_key) do update
            set request_count = daily_budget_usage.request_count + cast(:delta_requests as integer),
                token_count = daily_budget_usage.token_count + cast(:delta_tokens as integer),
                updated_at = {now_expression}
            where daily_budget_usage.request_count + cast(:delta_requests as integer) <= cast(:request_limit as integer)
              and daily_budget_usage.token_count + cast(:delta_tokens as integer) <= cast(:token_limit as integer)
            returning usage_date, budget_key, request_count, token_count
            """
        )
        row = (
            await self._session.execute(
                statement,
                {
                    "usage_date": usage_date,
                    "budget_key": budget_key,
                    "delta_requests": delta_requests,
                    "delta_tokens": delta_tokens,
                    "request_limit": request_limit,
                    "token_limit": token_limit,
                },
            )
        ).mappings().first()
        return self._to_usage(row)

    async def add_usage(
        self,
        budget_key: str,
        usage_date: date,
        delta_requests: int,
        delta_tokens: int,
    ) -> DailyBudgetUsage:
        now_expression = self._now_expression()
        statement = text(
            f"""
            insert into daily_budget_usage (usage_date, budget_key, request_count, token_count, updated_at)
            values (cast(:usage_date as date), cast(:budget_key as varchar(64)), cast(:delta_requests as integer), cast(:delta_tokens as integer), {now_expression})
            on conflict (usage_date, budget_key) do update
            set request_count = daily_budget_usage.request_count + cast(:delta_requests as integer),
                token_count = daily_budget_usage.token_count + cast(:delta_tokens as integer),
                updated_at = {now_expression}
            returning usage_date, budget_key, request_count, token_count
            """
        )
        row = (
            await self._session.execute(
                statement,
                {
                    "usage_date": usage_date,
                    "budget_key": budget_key,
                    "delta_requests": delta_requests,
                    "delta_tokens": delta_tokens,
                },
            )
        ).mappings().one()
        usage = self._to_usage(row)
        if usage is None:
            raise RuntimeError("daily_budget_usage_missing")
        return usage

    def _now_expression(self) -> str:
        return "now()" if self._session.bind and self._session.bind.dialect.name == "postgresql" else "CURRENT_TIMESTAMP"

    def _to_usage(self, row: Any) -> DailyBudgetUsage | None:
        if row is None:
            return None
        return DailyBudgetUsage(
            usage_date=row["usage_date"],
            budget_key=row["budget_key"],
            request_count=int(row["request_count"]),
            token_count=int(row["token_count"]),
        )
