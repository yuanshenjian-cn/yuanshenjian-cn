from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, Protocol

from app.contexts.ai_assistant.domain.llm_profile import LLMProfile


class LLMAnswerStreamGateway(Protocol):
    def stream_completion(
        self,
        profile: LLMProfile,
        system_prompt: str,
        user_message: str,
        references: list[dict[str, Any]] | None = None,
        *,
        provider: object | None = None,
        error_message: str = "AI 服务刚刚开小差了，请稍后重试。",
        fallback_answer: str = "当前 AI provider 未配置，已返回基于本地资料的降级响应。",
    ) -> AsyncIterator[str]:
        ...
