from __future__ import annotations

from typing import Protocol

from app.contexts.ai_assistant.domain.llm_profile import LLMProfile


class LLMProfileResolver(Protocol):
    def resolve_active_profile(self, scene: str) -> LLMProfile:
        ...
