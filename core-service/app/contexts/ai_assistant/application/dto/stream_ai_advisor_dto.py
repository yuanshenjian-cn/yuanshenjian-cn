from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class StreamAIAdvisorReq(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None
    scene: Literal["article", "author", "health", "health-column", "ai", "ai-column", "investment", "investment-column"]
    entrypoint: str = "home"
    domain: str | None = None
    page_title: str | None = None
    page_slug: str | None = None
    article_slug: str | None = None
    history: list[str] = Field(default_factory=list)
    use_global_glossary: bool = False
    cf_turnstile_response: str = ""
