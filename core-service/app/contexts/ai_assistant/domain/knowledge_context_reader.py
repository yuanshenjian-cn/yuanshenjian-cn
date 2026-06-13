from __future__ import annotations

from typing import Protocol


class KnowledgeContextReader(Protocol):
    async def query(
        self,
        query: str,
        article_slug: str | None = None,
        top_k: int = 5,
        *,
        scene: str | None = None,
        domain: str | None = None,
        page_slug: str | None = None,
    ) -> tuple[list[str], list[dict[str, str]]]:
        ...
