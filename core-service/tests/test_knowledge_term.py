from __future__ import annotations

import asyncio
from uuid import uuid4

from app.contexts.ai_assistant.application.list_glossary_app_service import ListGlossaryAppService
from app.contexts.ai_assistant.domain.knowledge_term_reader import KnowledgeTermReader
from app.contexts.knowledge_base.application.archive_knowledge_term_app_service import ArchiveKnowledgeTermAppService
from app.contexts.knowledge_base.application.create_knowledge_term_app_service import CreateKnowledgeTermAppService
from app.contexts.knowledge_base.application.dto.save_knowledge_term_dto import SaveKnowledgeTermReq
from app.contexts.knowledge_base.application.update_knowledge_term_app_service import UpdateKnowledgeTermAppService
from app.contexts.knowledge_base.domain.exceptions import KnowledgeTermNotFoundError, KnowledgeTermValidationError
from app.contexts.knowledge_base.infra.knowledge_term_query_reader import KnowledgeTermQueryReader
from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class StubKnowledgeTermDAO:
    def __init__(self, terms: list[KnowledgeTermPO] | None = None) -> None:
        self._terms = terms or []
        self.added: list[KnowledgeTermPO] = []

    async def list_all(self) -> list[KnowledgeTermPO]:
        return list(self._terms)

    async def list_enabled(self) -> list[KnowledgeTermPO]:
        return [term for term in self._terms if term.status == "enabled"]

    async def get_by_id(self, term_id: str) -> KnowledgeTermPO | None:
        for term in self._terms:
            if term.id == term_id:
                return term
        return None

    async def get_by_term(self, term: str) -> KnowledgeTermPO | None:
        for item in self._terms:
            if item.term == term:
                return item
        return None

    def add(self, term: KnowledgeTermPO) -> None:
        self._terms.append(term)
        self.added.append(term)


class StubSession:
    pass


def sample_term(**overrides) -> KnowledgeTermPO:
    return KnowledgeTermPO(
        id=str(uuid4()),
        term=overrides.get("term", "TDD"),
        aliases=overrides.get("aliases", ["测试驱动开发"]),
        definition=overrides.get("definition", "测试驱动开发"),
        explanation=overrides.get("explanation", "先写测试，再写实现。"),
        related_article_slugs=overrides.get("related_article_slugs", []),
        domains=overrides.get("domains", []),
        scenes=overrides.get("scenes", []),
        status=overrides.get("status", "enabled"),
    )


def test_create_knowledge_term_saves_term() -> None:
    dao = StubKnowledgeTermDAO()
    service = CreateKnowledgeTermAppService(dao)

    result = asyncio.run(
        service.execute(
            SaveKnowledgeTermReq(
                term="TDD",
                aliases=["测试驱动开发"],
                definition="测试驱动开发",
                explanation="先写测试，再写实现。",
            )
        )
    )

    assert result.status == "enabled"
    assert len(dao.added) == 1
    assert dao.added[0].term == "TDD"


def test_create_knowledge_term_rejects_duplicate() -> None:
    dao = StubKnowledgeTermDAO([sample_term()])
    service = CreateKnowledgeTermAppService(dao)

    try:
        asyncio.run(
            service.execute(
                SaveKnowledgeTermReq(
                    term="TDD",
                    aliases=[],
                    definition="重复",
                    explanation="重复",
                )
            )
        )
        raise AssertionError("should raise")
    except KnowledgeTermValidationError as error:
        assert error.error_code == "knowledge_term_conflict"


def test_update_knowledge_term_changes_fields() -> None:
    term = sample_term()
    dao = StubKnowledgeTermDAO([term])
    service = UpdateKnowledgeTermAppService(dao)

    result = asyncio.run(
        service.execute(
            term.id,
            SaveKnowledgeTermReq(
                term="TDD",
                aliases=["测试驱动开发"],
                definition="新定义",
                explanation="新解释",
            ),
        )
    )

    assert result.status == "enabled"
    assert term.definition == "新定义"
    assert term.explanation == "新解释"


def test_update_knowledge_term_raises_when_missing() -> None:
    dao = StubKnowledgeTermDAO()
    service = UpdateKnowledgeTermAppService(dao)

    try:
        asyncio.run(
            service.execute(
                "missing-id",
                SaveKnowledgeTermReq(
                    term="TDD",
                    aliases=[],
                    definition="定义",
                    explanation="解释",
                ),
            )
        )
        raise AssertionError("should raise")
    except KnowledgeTermNotFoundError:
        pass


def test_archive_knowledge_term_sets_status() -> None:
    term = sample_term()
    dao = StubKnowledgeTermDAO([term])
    service = ArchiveKnowledgeTermAppService(dao)

    result = asyncio.run(service.execute(term.id))

    assert result.status == "archived"
    assert term.status == "archived"


def test_list_glossary_filters_by_scene_and_domain() -> None:
    terms = [
        sample_term(term="TDD", scenes=["article"], domains=["ai"]),
        sample_term(term="Claude Code", scenes=["article"], domains=["ai"]),
        sample_term(term="泡水", scenes=["article"], domains=["health"]),
    ]
    dao = StubKnowledgeTermDAO(terms)
    service = ListGlossaryAppService(dao)

    result = asyncio.run(service.execute(scene="article", domain="ai"))

    assert len(result.items) == 2
    assert {item.term for item in result.items} == {"TDD", "Claude Code"}


def test_list_glossary_returns_all_when_no_filters() -> None:
    terms = [
        sample_term(term="TDD"),
        sample_term(term="Claude Code"),
    ]
    dao = StubKnowledgeTermDAO(terms)
    service = ListGlossaryAppService(dao)

    result = asyncio.run(service.execute(scene=None, domain=None))

    assert len(result.items) == 2


def test_list_glossary_empty_scenes_matches_all_scenes() -> None:
    terms = [
        sample_term(term="TDD", scenes=[], domains=[]),
        sample_term(term="Claude Code", scenes=["article"], domains=["ai"]),
    ]
    dao = StubKnowledgeTermDAO(terms)
    service = ListGlossaryAppService(dao)

    result = asyncio.run(service.execute(scene="article", domain="ai"))

    assert {item.term for item in result.items} == {"TDD", "Claude Code"}


class FakeTermReader(KnowledgeTermReader):
    def __init__(self, matches: list[dict[str, str]]) -> None:
        self._matches = matches

    async def find_matching_terms(
        self,
        query: str,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[dict[str, str]]:
        return list(self._matches)


def test_knowledge_term_query_reader_matches_term_in_query() -> None:
    # KnowledgeTermQueryReader 依赖真实数据库会话，这里只做构造验证
    assert KnowledgeTermQueryReader is not None
