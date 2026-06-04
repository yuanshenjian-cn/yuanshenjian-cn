from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Request, Response

from app.contexts.visitor_identity.domain.visitor_identity import VisitorIdentity
from app.contexts.visitor_identity.domain.visitor_identity_repository import VisitorIdentityRepository
from app.shared.domain.actor import Actor
from app.shared.domain.request_subject import RequestSubject
from app.shared.infra.request_identity_resolver import RequestIdentityResolver


class VisitorActorResolver:
    def __init__(
        self,
        repository: VisitorIdentityRepository,
        identity_resolver: RequestIdentityResolver | None = None,
    ) -> None:
        self._repository = repository
        self._identity_resolver = identity_resolver or RequestIdentityResolver()

    async def resolve(self, request: Request, response: Response) -> Actor:
        subject = await self._identity_resolver.resolve_public_subject(request, response)
        return await self.resolve_subject(subject)

    async def resolve_subject(self, subject: RequestSubject) -> Actor:
        if subject.visitor_key_hash is None:
            raise RuntimeError("visitor_key_hash_missing")

        visitor = await self._repository.get_by_visitor_key_hash(subject.visitor_key_hash)
        if visitor is None:
            visitor = await self._repository.add(
                VisitorIdentity(
                    id="",
                    visitor_key_hash=subject.visitor_key_hash,
                    first_seen_at=datetime.now(UTC),
                    last_seen_at=datetime.now(UTC),
                    risk_score=0,
                    created_at=datetime.now(UTC),
                )
            )
        else:
            visitor.mark_seen(datetime.now(UTC))
            visitor = await self._repository.save(visitor)
        return Actor(actor_type="visitor", visitor_id=visitor.id)
