from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class StreamAIAssistantChatReq(BaseModel):
    scene: Literal[
        "article_recommendation",
        "ai_briefing_recommendation",
        "investment_briefing_recommendation",
        "article",
        "author",
    ]
    message: str = Field(min_length=1, max_length=4000)
    context: dict[str, object] | None = None
    cf_turnstile_response: str = ""
