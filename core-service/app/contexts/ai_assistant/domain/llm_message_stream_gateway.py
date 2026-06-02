from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol

from app.contexts.ai_assistant.domain.llm_profile import LLMProfile


@dataclass(frozen=True)
class LLMChatMessage:
    role: str
    content: str


@dataclass(frozen=True)
class LLMChatUsage:
    prompt_tokens: int | None = None
    completion_tokens: int | None = None
    total_tokens: int | None = None

    def as_dict(self) -> dict[str, int | None]:
        return {
            "promptTokens": self.prompt_tokens,
            "completionTokens": self.completion_tokens,
            "totalTokens": self.total_tokens,
        }


@dataclass(frozen=True)
class LLMChatStreamEvent:
    delta: str = ""
    usage: LLMChatUsage | None = None


class LLMMessageStreamGateway(Protocol):
    def stream_chat(
        self,
        profile: LLMProfile,
        messages: list[LLMChatMessage],
        *,
        max_tokens: int,
        temperature: float,
    ) -> AsyncIterator[LLMChatStreamEvent]:
        ...
