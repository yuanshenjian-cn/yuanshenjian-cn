from __future__ import annotations

import asyncio

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService
from app.contexts.ai_assistant.infra.po.ai_request_event_po import AIRequestEventPO
from app.shared.infra.persistence.base import Base


def test_admin_ai_usage_overview_reads_real_request_events() -> None:
    async def run() -> None:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all, tables=[AIRequestEventPO.__table__])
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with session_factory() as session:
            session.add(
                AIRequestEventPO(
                    scene="article",
                    actor_type="visitor",
                    visitor_id=None,
                    user_id=None,
                    conversation_id=None,
                    provider="deepseek",
                    model="deepseek-v4-flash",
                    input_chars=10,
                    output_chars=20,
                    prompt_tokens=11,
                    completion_tokens=22,
                    latency_ms=100,
                    status="success",
                    error_code=None,
                )
            )
            await session.flush()

            payload = await AdminConsoleQueryService(session).get_ai_usage_overview()

            assert payload["total_requests"] == 1
            assert payload["items"] == [
                {
                    "scene": "article",
                    "status": "success",
                    "requests": 1,
                    "prompt_tokens": 11,
                    "completion_tokens": 22,
                }
            ]
        await engine.dispose()

    asyncio.run(run())
