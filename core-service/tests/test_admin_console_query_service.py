from __future__ import annotations

import asyncio
from typing import cast

from sqlalchemy import Table
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.contexts.admin_console.infra.admin_console_query_service import AdminConsoleQueryService
from app.contexts.knowledge_base.infra.knowledge_term_query_service import KnowledgeTermQueryService
from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO
from app.contexts.ai_assistant.infra.po.ai_request_event_po import AIRequestEventPO
from app.shared.infra.persistence.base import Base


def test_admin_ai_usage_overview_reads_real_request_events() -> None:
    async def run() -> None:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        ai_request_event_table = cast(Table, AIRequestEventPO.__table__)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all, tables=[ai_request_event_table])
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


def test_knowledge_term_query_service_supports_fuzzy_filters() -> None:
    async def run() -> None:
        engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        knowledge_term_table = cast(Table, KnowledgeTermPO.__table__)
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all, tables=[knowledge_term_table])
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with session_factory() as session:
            session.add_all(
                [
                    KnowledgeTermPO(
                        term="Claude Code",
                        aliases=[],
                        definition="定义",
                        explanation="解释",
                        related_article_slugs=[],
                        domains=["ai"],
                        scenes=["article"],
                        status="enabled",
                    ),
                    KnowledgeTermPO(
                        term="泡水喝",
                        aliases=[],
                        definition="定义",
                        explanation="解释",
                        related_article_slugs=[],
                        domains=["health"],
                        scenes=["daily-brief"],
                        status="enabled",
                    ),
                ]
            )
            await session.flush()

            rows, total = await KnowledgeTermQueryService(session).list_terms_page(
                page=1,
                page_size=10,
                term="Claude",
                scene="arti",
                domain="a",
            )

            assert total == 1
            assert [item["term"] for item in rows] == ["Claude Code"]
        await engine.dispose()

    asyncio.run(run())
