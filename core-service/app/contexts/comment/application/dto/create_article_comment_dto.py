from __future__ import annotations

from pydantic import BaseModel, Field

from app.shared.domain.actor import Actor


class SubmitArticleCommentReq(BaseModel):
    parent_id: str | None = None
    display_name: str = Field(min_length=1, max_length=80)
    email: str | None = None
    content_markdown: str = Field(min_length=1, max_length=4000)
    turnstile_token: str = ""


class CreateArticleCommentReq(BaseModel):
    article_slug: str
    actor: Actor
    display_name: str = Field(min_length=1, max_length=80)
    email_hash: str | None = None
    content_markdown: str = Field(min_length=1, max_length=4000)
    parent_id: str | None = None
    ip_hash: str | None = None
    user_agent_hash: str | None = None

    model_config = {"arbitrary_types_allowed": True}


class CreateArticleCommentResp(BaseModel):
    id: str
    status: str
    message: str
