from __future__ import annotations

from datetime import UTC, datetime

from fastapi import Request, Response

from app.contexts.visitor_identity.domain.visitor_identity import VisitorIdentity
from app.contexts.visitor_identity.domain.visitor_identity_repository import VisitorIdentityRepository
from app.shared.domain.actor import Actor
from app.shared.infra.app_config import settings
from app.shared.infra.secret_hash import create_secret_token, hash_with_pepper

VISITOR_COOKIE = "visitor_id"


class VisitorActorResolver:
    def __init__(self, repository: VisitorIdentityRepository) -> None:
        self._repository = repository

    def resolve(self, request: Request, response: Response) -> Actor:
        visitor_token = request.cookies.get(VISITOR_COOKIE) or create_secret_token()
        visitor_key_hash = hash_with_pepper(visitor_token, settings.session_secret)
        visitor = self._repository.get_by_visitor_key_hash(visitor_key_hash)
        if visitor is None:
            visitor = self._repository.add(
                VisitorIdentity(
                    id="",
                    visitor_key_hash=visitor_key_hash,
                    first_seen_at=datetime.now(UTC),
                    last_seen_at=datetime.now(UTC),
                    risk_score=0,
                    created_at=datetime.now(UTC),
                )
            )
        else:
            visitor.mark_seen(datetime.now(UTC))
            visitor = self._repository.save(visitor)

        if request.cookies.get(VISITOR_COOKIE) is None:
            response.set_cookie(
                VISITOR_COOKIE,
                visitor_token,
                httponly=True,
                secure=settings.app_env == "production",
                samesite="lax",
                domain=settings.cookie_domain if settings.app_env == "production" else None,
                path="/",
                max_age=60 * 60 * 24 * 365,
            )
        return Actor(actor_type="visitor", visitor_id=visitor.id)
