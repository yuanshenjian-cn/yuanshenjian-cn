from __future__ import annotations

import asyncio
import json

import pytest

from app.contexts.ai_assistant.infra.providers.deepseek_llm_provider import DeepSeekLLMProvider
from app.contexts.ai_assistant.infra.providers.llm_provider import (
    LLMProviderChatRequest,
    LLMProviderMessage,
    LLMProviderProfile,
)
from app.contexts.ai_assistant.infra.providers.llm_provider_factory import create_llm_provider
from app.contexts.ai_assistant.infra.providers.moonshot_cn_llm_provider import MoonshotCnLLMProvider
from app.contexts.ai_assistant.infra.providers.openai_compatible_llm_provider import OpenAICompatibleLLMProvider


def _profile(provider: str, model: str = "test-model") -> LLMProviderProfile:
    return LLMProviderProfile(
        id=f"{provider}/{model}",
        provider=provider,
        base_url="https://example.com/v1",
        model=model,
        api_key="test-key",
    )


def test_create_llm_provider_routes_to_expected_provider_class() -> None:
    assert isinstance(create_llm_provider(_profile("deepseek")), DeepSeekLLMProvider)
    assert isinstance(create_llm_provider(_profile("moonshot-cn")), MoonshotCnLLMProvider)
    assert isinstance(create_llm_provider(_profile("openai-compatible")), OpenAICompatibleLLMProvider)


def test_create_llm_provider_rejects_unknown_provider() -> None:
    with pytest.raises(ValueError, match="未支持的 LLM provider"):
        create_llm_provider(_profile("unknown-provider"))


def test_openai_compatible_provider_parses_chat_and_stream_usage() -> None:
    requests: list[tuple[str, str]] = []

    def handler(request):
        requests.append((request.url.path, request.method))
        payload = json.loads(request.content.decode("utf-8"))
        if request.headers.get("content-type") == "application/json":
            if payload.get("stream") is True:
                body = b"\n".join(
                    [
                        b'data: {"choices":[{"delta":{"content":"hello"}}]}',
                        b'data: {"usage":{"prompt_tokens":10,"completion_tokens":20,"total_tokens":30}}',
                        b"data: [DONE]",
                    ]
                )
                return __import__("httpx").Response(200, content=body)
            return __import__("httpx").Response(
                200,
                json={
                    "choices": [{"message": {"content": "ok"}}],
                    "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
                },
            )
        return __import__("httpx").Response(500, json={"error": {"message": "unexpected"}})

    import httpx

    provider = OpenAICompatibleLLMProvider(
        "openai-compatible",
        "OpenAI Compatible",
        "test-key",
        "https://example.com/v1",
        "test-model",
        transport=httpx.MockTransport(handler),
    )

    async def collect():
        response = await provider.chat(
            LLMProviderChatRequest(
                messages=[LLMProviderMessage(role="user", content="hello")],
                max_tokens=100,
                temperature=0.2,
                stream=False,
            )
        )
        stream_events = [
            event
            async for event in provider.stream_chat(
                LLMProviderChatRequest(
                    messages=[LLMProviderMessage(role="user", content="hello")],
                    max_tokens=100,
                    temperature=0.2,
                    stream=True,
                )
            )
        ]
        return response, stream_events

    response, stream_events = asyncio.run(collect())

    assert response.content == "ok"
    assert response.usage is not None
    assert response.usage.total_tokens == 3
    assert stream_events[0].delta == "hello"
    assert stream_events[1].usage is not None
    assert stream_events[1].usage.total_tokens == 30
    assert requests == [("/v1/chat/completions", "POST"), ("/v1/chat/completions", "POST")]
