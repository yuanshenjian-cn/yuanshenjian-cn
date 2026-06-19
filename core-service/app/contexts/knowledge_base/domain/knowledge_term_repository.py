from __future__ import annotations

from typing import Protocol

from app.contexts.knowledge_base.infra.po.knowledge_term_po import KnowledgeTermPO


class KnowledgeTermRepository(Protocol):
    async def list_all(self) -> list[KnowledgeTermPO]: ...

    async def list_enabled(self) -> list[KnowledgeTermPO]: ...

    async def get_by_id(self, term_id: str) -> KnowledgeTermPO | None: ...

    async def get_by_term(self, term: str) -> KnowledgeTermPO | None: ...

    def add(self, term: KnowledgeTermPO) -> None: ...
