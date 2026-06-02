from __future__ import annotations

from pydantic import BaseModel, Field


class StreamAIAdvisorReq(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None
    entrypoint: str = "home"
    article_slug: str | None = None
    turnstile_token: str = ""
