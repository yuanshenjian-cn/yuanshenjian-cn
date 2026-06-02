from __future__ import annotations

from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class LLMProviderMessage:
    role: str
    content: str


@dataclass(frozen=True)
class LLMProviderChatRequest:
    messages: list[LLMProviderMessage]
    max_tokens: int
    temperature: float
    stream: bool


@dataclass(frozen=True)
class LLMProviderUsage:
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
class LLMProviderChatResponse:
    content: str
    usage: LLMProviderUsage | None = None


@dataclass(frozen=True)
class LLMProviderStreamEvent:
    delta: str = ""
    usage: LLMProviderUsage | None = None


@dataclass(frozen=True)
class LLMProviderProfile:
    id: str
    provider: str
    base_url: str
    model: str
    api_key: str
    api_key_env: str
    temperature: float = 0.2
    max_tokens: int = 1200


class LLMProvider(Protocol):
    name: str

    async def chat(self, request: LLMProviderChatRequest) -> LLMProviderChatResponse:
        ...

    def stream_chat(self, request: LLMProviderChatRequest) -> AsyncIterator[LLMProviderStreamEvent]:
        ...
