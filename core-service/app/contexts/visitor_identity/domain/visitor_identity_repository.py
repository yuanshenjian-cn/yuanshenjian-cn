from __future__ import annotations

from typing import Protocol

from app.contexts.visitor_identity.domain.visitor_identity import VisitorIdentity


class VisitorIdentityRepository(Protocol):
    async def get_by_visitor_key_hash(self, visitor_key_hash: str) -> VisitorIdentity | None:
        ...

    async def add(self, visitor: VisitorIdentity) -> VisitorIdentity:
        ...

    async def save(self, visitor: VisitorIdentity) -> VisitorIdentity:
        ...
