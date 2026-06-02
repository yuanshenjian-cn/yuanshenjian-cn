from __future__ import annotations

from app.contexts.visitor_identity.application.dto.get_current_visitor_identity_dto import GetCurrentVisitorIdentityResp
from app.shared.domain.actor import Actor


class GetCurrentVisitorIdentityAppService:
    def execute(self, actor: Actor) -> GetCurrentVisitorIdentityResp:
        return GetCurrentVisitorIdentityResp(actor_type=actor.actor_type, visitor_id=actor.visitor_id)
