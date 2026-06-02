from __future__ import annotations

from pydantic import BaseModel

from app.shared.domain.actor import Actor


class SubmitArticleViewReq(BaseModel):
    referrer: str | None = None


class RecordArticleViewReq(BaseModel):
    article_slug: str
    actor: Actor
    ip_hash: str | None
    user_agent_hash: str | None
    referrer_origin: str | None

    model_config = {"arbitrary_types_allowed": True}


class RecordArticleViewResp(BaseModel):
    article_slug: str
    pv: int
    uv: int
