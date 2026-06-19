from __future__ import annotations

from typing import Protocol


class KnowledgeTermReader(Protocol):
    async def find_matching_terms(
        self,
        query: str,
        *,
        scene: str | None = None,
        domain: str | None = None,
    ) -> list[dict[str, str]]:
        ...
