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
