from __future__ import annotations

from collections.abc import AsyncIterator

from app.contexts.ai_assistant.domain.llm_message_stream_gateway import LLMChatMessage, LLMChatStreamEvent, LLMChatUsage, LLMMessageStreamGateway
from app.contexts.ai_assistant.domain.llm_profile import LLMProfile
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProviderChatRequest, LLMProviderMessage
from app.contexts.ai_assistant.infra.providers.llm_provider_factory import create_llm_provider


class ProviderBackedLLMMessageStreamGateway(LLMMessageStreamGateway):
    async def stream_chat(
        self,
        profile: LLMProfile,
        messages: list[LLMChatMessage],
        *,
        max_tokens: int,
        temperature: float,
    ) -> AsyncIterator[LLMChatStreamEvent]:
        provider = create_llm_provider(profile)
        request = LLMProviderChatRequest(
            messages=[LLMProviderMessage(role=item.role, content=item.content) for item in messages],
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )
        async for event in provider.stream_chat(request):
            usage = None
            if event.usage is not None:
                usage = LLMChatUsage(
                    prompt_tokens=event.usage.prompt_tokens,
                    completion_tokens=event.usage.completion_tokens,
                    total_tokens=event.usage.total_tokens,
                )
            yield LLMChatStreamEvent(delta=event.delta, usage=usage)
