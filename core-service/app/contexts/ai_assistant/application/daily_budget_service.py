from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime

from app.contexts.ai_assistant.domain.daily_budget_repository import DailyBudgetRepository
from app.shared.infra.app_config import settings

MAX_BUDGET_COUNT = 2_147_483_647


class DailyBudgetExceededError(Exception):
    def __init__(self, budget_key: str) -> None:
        self.budget_key = budget_key
        super().__init__(budget_key)


@dataclass(frozen=True)
class DailyBudgetReservation:
    usage_date: date
    request_budget_key: str
    token_budget_key: str
    estimated_tokens: int


class DailyBudgetService:
    def __init__(
        self,
        repository: DailyBudgetRepository,
        chat_daily_request_limit: int | None = None,
        advisor_daily_request_limit: int | None = None,
        global_daily_token_limit: int | None = None,
    ) -> None:
        self._repository = repository
        self._chat_daily_request_limit = chat_daily_request_limit or settings.ai_chat_daily_request_limit
        self._advisor_daily_request_limit = advisor_daily_request_limit or settings.ai_advisor_daily_request_limit
        self._global_daily_token_limit = global_daily_token_limit or settings.ai_global_daily_token_limit

    async def reserve_chat_request(
        self,
        estimated_tokens: int,
        usage_date: date | None = None,
    ) -> DailyBudgetReservation:
        return await self._reserve_request(
            request_budget_key="ai_chat_requests",
            request_limit=self._chat_daily_request_limit,
            estimated_tokens=estimated_tokens,
            usage_date=usage_date,
        )

    async def reserve_advisor_request(
        self,
        estimated_tokens: int,
        usage_date: date | None = None,
    ) -> DailyBudgetReservation:
        return await self._reserve_request(
            request_budget_key="ai_advisor_requests",
            request_limit=self._advisor_daily_request_limit,
            estimated_tokens=estimated_tokens,
            usage_date=usage_date,
        )

    async def finalize_token_usage(
        self,
        reservation: DailyBudgetReservation,
        actual_total_tokens: int | None,
    ) -> None:
        if actual_total_tokens is None:
            return
        delta_tokens = actual_total_tokens - reservation.estimated_tokens
        if delta_tokens == 0:
            return
        await self._repository.add_usage(
            reservation.token_budget_key,
            reservation.usage_date,
            delta_requests=0,
            delta_tokens=delta_tokens,
        )

    async def _reserve_request(
        self,
        request_budget_key: str,
        request_limit: int,
        estimated_tokens: int,
        usage_date: date | None,
    ) -> DailyBudgetReservation:
        current_usage_date = usage_date or datetime.now(UTC).date()
        request_usage = await self._repository.reserve(
            request_budget_key,
            current_usage_date,
            delta_requests=1,
            delta_tokens=0,
            request_limit=request_limit,
            token_limit=MAX_BUDGET_COUNT,
        )
        if request_usage is None:
            raise DailyBudgetExceededError(request_budget_key)

        token_usage = await self._repository.reserve(
            "ai_global_tokens",
            current_usage_date,
            delta_requests=0,
            delta_tokens=estimated_tokens,
            request_limit=MAX_BUDGET_COUNT,
            token_limit=self._global_daily_token_limit,
        )
        if token_usage is None:
            await self._repository.add_usage(
                request_budget_key,
                current_usage_date,
                delta_requests=-1,
                delta_tokens=0,
            )
            raise DailyBudgetExceededError("ai_global_tokens")

        return DailyBudgetReservation(
            usage_date=current_usage_date,
            request_budget_key=request_budget_key,
            token_budget_key="ai_global_tokens",
            estimated_tokens=estimated_tokens,
        )
