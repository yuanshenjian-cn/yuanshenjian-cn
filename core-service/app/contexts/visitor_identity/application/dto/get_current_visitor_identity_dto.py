from __future__ import annotations

from pydantic import BaseModel


class GetCurrentVisitorIdentityResp(BaseModel):
    actor_type: str
    visitor_id: str | None = None
