from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, cast

from app.contexts.ai_assistant.domain.llm_profile import LLMProfile
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProvider, LLMProviderChatRequest, LLMProviderMessage
from app.contexts.ai_assistant.infra.providers.llm_provider_factory import create_llm_provider
from app.contexts.ai_assistant.infra.sse_event_codec import encode_sse_event
from app.shared.infra.app_config import settings


class LLMStreamService:
    async def stream_completion(
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
        if settings.emergency_disable_ai:
            yield encode_sse_event("error", {"message": "AI 服务暂时不可用。"})
            yield encode_sse_event("done", {"usage": None})
            return

        if not profile.api_key or not profile.base_url or profile.model == "fallback":
            yield encode_sse_event("answer-delta", {"delta": fallback_answer})
            yield encode_sse_event("references", {"references": references or []})
            yield encode_sse_event("done", {"usage": None})
            return

        resolved_provider = cast(LLMProvider, provider) if provider is not None else create_llm_provider(profile)
        usage_payload: dict[str, int | None] | None = None

        try:
            async for chunk in resolved_provider.stream_chat(
                LLMProviderChatRequest(
                    messages=[
                        LLMProviderMessage(role="system", content=system_prompt),
                        LLMProviderMessage(role="user", content=user_message),
                    ],
                    max_tokens=profile.max_tokens,
                    temperature=profile.temperature,
                    stream=True,
                )
            ):
                if chunk.delta:
                    yield encode_sse_event("answer-delta", {"delta": chunk.delta})
                if chunk.usage is not None:
                    usage_payload = chunk.usage.as_dict()
        except Exception:
            yield encode_sse_event("error", {"message": error_message})
            return

        yield encode_sse_event("references", {"references": references or []})
        yield encode_sse_event("done", {"usage": usage_payload})
