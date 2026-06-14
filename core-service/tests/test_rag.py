import asyncio
from datetime import datetime, timezone
from types import SimpleNamespace

from sqlalchemy.dialects.postgresql.asyncpg import dialect as asyncpg_dialect

from app.contexts.knowledge_base.infra.knowledge_context_query_service import KnowledgeContextQueryService
from app.contexts.knowledge_base.infra.advisor_prompt_builder import build_advisor_prompt
from app.contexts.knowledge_base.infra.published_content_sync_service import PublishedContentSyncService


def test_content_hash_is_stable() -> None:
    service = PublishedContentSyncService()
    assert service.content_hash("hello") == service.content_hash("hello")
    assert service.content_hash("hello") != service.content_hash("world")


def test_unpublished_content_is_not_ingested() -> None:
    service = PublishedContentSyncService()
    assert service.should_ingest_frontmatter({"published": False}) is False
    assert service.should_ingest_frontmatter({"title": "公开", "date": "2026-01-01"}) is True


def test_canonical_source_id_uses_slug() -> None:
    assert PublishedContentSyncService().canonical_source_id("article", "hello-world") == "article:hello-world"


def test_advisor_prompt_requires_citations() -> None:
    prompt = build_advisor_prompt("怎么学 TDD", ["资料 A"])
    assert "资料不足" in prompt
    assert "引用" in prompt


def test_chunk_text_keeps_short_text_as_one_chunk() -> None:
    assert PublishedContentSyncService().chunk_text("标题\n\n正文", max_chars=1000) == ["标题\n\n正文"]


def test_sync_service_maps_health_path_to_health_domain() -> None:
    service = PublishedContentSyncService()
    assert service._domains_for_path(__import__("pathlib").Path("content/health/eat/file.md"), "article") == ["health"]


def test_sync_service_maps_ai_path_to_ai_scene() -> None:
    service = PublishedContentSyncService()
    assert "ai-column" in service._scenes_for_path(__import__("pathlib").Path("content/swd/ai-coding/opencode/file.md"), "article")


def test_sync_service_maps_investment_path_to_investment_domain() -> None:
    service = PublishedContentSyncService()
    assert service._domains_for_path(__import__("pathlib").Path("content/investment/beginner-investing/file.md"), "article") == ["investment"]


def test_sync_service_parses_published_at_from_frontmatter() -> None:
    service = PublishedContentSyncService()
    assert service._parse_published_at({"date": "2026-06-14"}) == datetime(2026, 6, 14, tzinfo=timezone.utc)
    assert service._parse_published_at({"date": datetime(2026, 6, 14, 10, 30, tzinfo=timezone.utc)}) == datetime(2026, 6, 14, 10, 30, tzinfo=timezone.utc)
    assert service._parse_published_at({"date": "2026-06-14T10:30:00Z"}) == datetime(2026, 6, 14, 10, 30, tzinfo=timezone.utc)
    assert service._parse_published_at({"title": "no date"}) is None


def test_sync_service_builds_briefing_url_from_date() -> None:
    service = PublishedContentSyncService()
    metadata = {"date": "2026-06-14"}
    assert service._document_url("ai_briefing", "2026-06-14-ai-briefing", metadata) == "/ai/briefings/2026-06-14"
    assert service._document_url("investment_briefing", "2026-06-14-investment-briefing", metadata) == "/investment/briefings/2026-06-14"
    assert service._document_url("article", "hello-world", {"date": "2026-06-14"}) == "/articles/hello-world"


def test_sync_service_extracts_date_terms_for_chunk_enrichment() -> None:
    service = PublishedContentSyncService()
    terms = service._extract_briefing_date_terms({"date": "2026-06-14"})
    assert "2026-06-14" in terms
    assert "2026年6月14日" in terms
    assert "6月14日" in terms
    assert "2026/06/14" in terms


def test_query_service_extracts_dates_from_query() -> None:
    service = KnowledgeContextQueryService()
    assert service._extract_dates_from_query("2026-06-14的简报")[0].date().isoformat() == "2026-06-14"
    assert service._extract_dates_from_query("6月14日发生了什么")[0].month == 6
    assert service._extract_dates_from_query("6月14日发生了什么")[0].day == 14
    assert service._extract_dates_from_query("今天怎么样") == []


def test_query_service_falls_back_from_page_slug_to_scene_scope() -> None:
    class StubSession:
        def __init__(self) -> None:
            self.calls = 0

        async def execute(self, statement):
            del statement
            self.calls += 1
            if self.calls == 1:
                return []
            return [
                (
                    SimpleNamespace(id="chunk-1", heading=None, content="AI 资料正文"),
                    SimpleNamespace(title="AI 文档", url="/articles/ai-doc", source_type="article"),
                )
            ]

    async def run() -> None:
        session = StubSession()
        contexts, references = await KnowledgeContextQueryService().query_contexts(
            session,
            "AI",
            scene="ai-column",
            domain="ai",
            page_slug="missing-page",
        )
        assert contexts == ["AI 资料正文"]
        assert references[0]["source_type"] == "article-section"
        assert session.calls == 2

    asyncio.run(run())


def test_query_service_matches_chinese_topic_within_scene_scope() -> None:
    class StubSession:
        def __init__(self) -> None:
            self.calls = 0

        async def execute(self, statement):
            del statement
            self.calls += 1
            if self.calls == 1:
                return []
            return [
                (
                    SimpleNamespace(id="chunk-1", heading="地中海饮食", content="地中海饮食是常见的健康饮食方式"),
                    SimpleNamespace(title="地中海饮食", url="/articles/mediterranean-diet", source_type="article"),
                ),
                (
                    SimpleNamespace(id="chunk-2", heading="陈皮：泡出一杯温润", content="陈皮泡水每次 3 到 5 克更稳妥，建议饭后半小时到两餐之间喝。"),
                    SimpleNamespace(title="陈皮：泡出一杯温润", url="/articles/how-to-drink-chenpi-water", source_type="article"),
                ),
            ]

    async def run() -> None:
        session = StubSession()
        contexts, references = await KnowledgeContextQueryService().query_contexts(
            session,
            "陈皮怎么喝更健康",
            scene="health",
            domain="health",
            page_slug="health",
        )
        assert contexts[0].startswith("陈皮泡水")
        assert references[0]["title"] == "陈皮：泡出一杯温润"
        assert session.calls == 2

    asyncio.run(run())


def test_query_service_keeps_scoped_articles_for_navigation_query() -> None:
    class StubSession:
        async def execute(self, statement):
            del statement
            return [
                (
                    SimpleNamespace(id="chunk-1", heading="早餐", content="一份关于早餐搭配的内容"),
                    SimpleNamespace(title="早餐怎么吃", url="/articles/breakfast", source_type="article"),
                ),
                (
                    SimpleNamespace(id="chunk-2", heading="饮水", content="一份关于喝水习惯的内容"),
                    SimpleNamespace(title="喝水怎么喝", url="/articles/drink-water", source_type="article"),
                ),
            ]

    async def run() -> None:
        contexts, references = await KnowledgeContextQueryService().query_contexts(
            StubSession(),
            "有哪些文章推荐",
            scene="health",
            domain="health",
            page_slug="health",
        )
        assert contexts == ["一份关于早餐搭配的内容", "一份关于喝水习惯的内容"]
        assert [reference["url"] for reference in references] == ["/articles/breakfast", "/articles/drink-water"]

    asyncio.run(run())


def test_query_service_does_not_fallback_to_global_scope_when_article_slug_is_present() -> None:
    class StubSession:
        def __init__(self) -> None:
            self.calls = 0

        async def execute(self, statement):
            del statement
            self.calls += 1
            return []

    async def run() -> None:
        session = StubSession()
        contexts, references = await KnowledgeContextQueryService().query_contexts(
            session,
            "文章",
            article_slug="missing-article",
            scene="article",
            domain="ai",
        )
        assert contexts == []
        assert references == []
        assert session.calls == 1

    asyncio.run(run())


def test_query_service_casts_json_scope_filters_for_postgresql() -> None:
    captured_statements = []

    class StubSession:
        async def execute(self, statement):
            captured_statements.append(statement)
            return []

    async def run() -> None:
        await KnowledgeContextQueryService().query_contexts(
            StubSession(),
            "AI",
            article_slug="demo-article",
            scene="article",
            domain="ai",
            page_slug="demo-article",
        )

    asyncio.run(run())

    compiled_statement = captured_statements[0].compile(dialect=asyncpg_dialect())
    compiled = str(compiled_statement)

    assert "CAST(knowledge_documents.scenes AS TEXT)" in compiled
    assert "CAST(knowledge_documents.domains AS TEXT)" in compiled
    assert "knowledge_documents.scenes LIKE" not in compiled
    assert "knowledge_documents.domains LIKE" not in compiled
    assert "CAST(knowledge_documents.scenes AS TEXT) LIKE $4::VARCHAR" in compiled
    assert "CAST(knowledge_documents.domains AS TEXT) LIKE $5::VARCHAR" in compiled
    assert '%"article"%' == compiled_statement.params["param_1"]
    assert '%"ai"%' == compiled_statement.params["param_2"]
    assert str(compiled_statement.binds["param_1"].type) == "VARCHAR"
    assert str(compiled_statement.binds["param_2"].type) == "VARCHAR"
