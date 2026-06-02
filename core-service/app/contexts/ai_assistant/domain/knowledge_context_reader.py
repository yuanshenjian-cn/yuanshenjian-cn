from __future__ import annotations

from typing import Protocol


class KnowledgeContextReader(Protocol):
    def query(self, query: str, article_slug: str | None = None, top_k: int = 5) -> tuple[list[str], list[dict[str, str]]]:
        ...
