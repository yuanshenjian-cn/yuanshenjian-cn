from __future__ import annotations

import asyncio
from datetime import date

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.contexts.ai_assistant.application.ai_usage_recorder import (
    AIStreamUsage,
    AIUsageAuditContext,
    wrap_stream_with_usage_finalize,
)
from app.contexts.ai_assistant.application.daily_budget_service import (
    DailyBudgetExceededError,
    DailyBudgetReservation,
    DailyBudgetService,
)
from app.contexts.ai_assistant.infra.dao.daily_budget_usage_dao import DailyBudgetUsageDAO
from app.contexts.ai_assistant.infra.po.daily_budget_usage_po import DailyBudgetUsagePO
from app.contexts.ai_assistant.infra.sqlmodel_daily_budget_repository import SQLModelDailyBudgetRepository
from app.shared.infra.persistence.base import Base


async def build_session_factory() -> tuple[AsyncEngine, async_sessionmaker[AsyncSession]]:
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all, tables=[DailyBudgetUsagePO.__table__])
    return engine, async_sessionmaker(engine, expire_on_commit=False)


def test_reserve_request_is_atomic_when_limit_reached() -> None:
    async def run() -> None:
        engine, session_factory = await build_session_factory()
        async with session_factory() as session:
            repo = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
            usage_date = date(2026, 6, 4)

            first = await repo.reserve("ai_chat_requests", usage_date, delta_requests=1, delta_tokens=0, request_limit=1, token_limit=100)
            second = await repo.reserve("ai_chat_requests", usage_date, delta_requests=1, delta_tokens=0, request_limit=1, token_limit=100)

            assert first is not None
            assert second is None
        await engine.dispose()

    asyncio.run(run())


def test_daily_budget_service_reserves_and_finalizes_actual_token_usage() -> None:
    async def run() -> None:
        engine, session_factory = await build_session_factory()
        async with session_factory() as session:
            repo = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
            service = DailyBudgetService(repo, chat_daily_request_limit=5, global_daily_token_limit=100)
            usage_date = date(2026, 6, 4)

            reservation = await service.reserve_chat_request(estimated_tokens=80, usage_date=usage_date)
            await service.finalize_token_usage(reservation, actual_total_tokens=60)
            token_usage = await repo.reserve("ai_global_tokens", usage_date, 0, 40, 100, 100)

            assert token_usage is not None
            assert token_usage.token_count == 100
        await engine.dispose()

    asyncio.run(run())


def test_daily_budget_service_rejects_when_global_token_limit_reached() -> None:
    async def run() -> None:
        engine, session_factory = await build_session_factory()
        async with session_factory() as session:
            repo = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
            service = DailyBudgetService(repo, chat_daily_request_limit=5, global_daily_token_limit=50)

            try:
                await service.reserve_chat_request(estimated_tokens=80, usage_date=date(2026, 6, 4))
            except DailyBudgetExceededError as error:
                assert error.budget_key == "ai_global_tokens"
            else:
                raise AssertionError("expected DailyBudgetExceededError")
        await engine.dispose()

    asyncio.run(run())


def test_stream_wrapper_records_usage_from_done_event() -> None:
    async def stream():
        yield 'event: answer-delta\ndata: {"delta":"hi"}\n\n'
        yield 'event: done\ndata: {"usage":{"promptTokens":11,"completionTokens":22,"totalTokens":33}}\n\n'

    class Recorder:
        def __init__(self) -> None:
            self.usage: AIStreamUsage | None = None
            self.status: str | None = None

        async def record_and_finalize(
            self,
            reservation: DailyBudgetReservation,
            audit_context: AIUsageAuditContext,
            output_chars: int,
            usage: AIStreamUsage | None,
            latency_ms: int,
            status: str,
            error_code: str | None,
        ) -> None:
            del reservation, audit_context, output_chars, latency_ms, error_code
            self.usage = usage
            self.status = status

    async def run() -> None:
        recorder = Recorder()
        reservation = DailyBudgetReservation(
            usage_date=date(2026, 6, 4),
            request_budget_key="ai_chat_requests",
            token_budget_key="ai_global_tokens",
            estimated_tokens=10,
        )
        chunks = [
            chunk
            async for chunk in wrap_stream_with_usage_finalize(
                stream(),
                reservation,
                AIUsageAuditContext(scene="article", actor=None, provider=None, model=None, input_chars=2),
                recorder,
            )
        ]

        assert len(chunks) == 2
        assert recorder.usage == AIStreamUsage(prompt_tokens=11, completion_tokens=22, total_tokens=33)
        assert recorder.status == "success"

    asyncio.run(run())
