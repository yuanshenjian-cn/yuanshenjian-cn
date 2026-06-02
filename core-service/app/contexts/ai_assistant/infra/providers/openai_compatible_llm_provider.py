from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.contexts.ai_assistant.infra.providers.llm_provider import (
    LLMProvider,
    LLMProviderChatRequest,
    LLMProviderChatResponse,
    LLMProviderStreamEvent,
    LLMProviderUsage,
)


def _is_record(value: Any) -> bool:
    return isinstance(value, dict)


def _normalize_text_parts(parts: list[str]) -> str | None:
    text = "\n".join(part.strip() for part in parts if part.strip()).strip()
    return text or None


def _extract_text_parts(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value] if value.strip() else []

    if isinstance(value, list):
        text_parts: list[str] = []
        for item in value:
            text_parts.extend(_extract_text_parts(item))
        return text_parts

    if not _is_record(value):
        return []

    text_candidates: list[str] = []
    for key in ("text", "content", "output_text", "outputText"):
        candidate = value.get(key)
        if isinstance(candidate, str):
            text_candidates.append(candidate)

    for key in ("content", "parts", "items"):
        candidate = value.get(key)
        if isinstance(candidate, (list, dict)):
            text_candidates.extend(_extract_text_parts(candidate))

    return text_candidates


def _get_provider_error_message(payload: Any) -> str | None:
    if not _is_record(payload):
        return None
    error = payload.get("error")
    if _is_record(error) and isinstance(error.get("message"), str):
        return str(error["message"])
    return None


def _get_content(payload: Any) -> str | None:
    if not _is_record(payload):
        return None

    if isinstance(payload.get("output_text"), str):
        output_text = str(payload["output_text"]).strip()
        return output_text or None

    output = _normalize_text_parts(_extract_text_parts(payload.get("output")))
    if output:
        return output

    choices = payload.get("choices")
    if not isinstance(choices, list) or not choices:
        return None

    first_choice = choices[0]
    if not _is_record(first_choice):
        return None

    if isinstance(first_choice.get("text"), str):
        text = str(first_choice["text"]).strip()
        return text or None

    message = first_choice.get("message")
    if not _is_record(message):
        return None
    return _normalize_text_parts(_extract_text_parts(message.get("content")))


def _get_usage(payload: Any) -> LLMProviderUsage | None:
    if not _is_record(payload):
        return None
    usage = payload.get("usage")
    if not _is_record(usage):
        return None

    prompt_tokens = usage.get("prompt_tokens")
    completion_tokens = usage.get("completion_tokens")
    total_tokens = usage.get("total_tokens")

    if not any(isinstance(value, int) for value in (prompt_tokens, completion_tokens, total_tokens)):
        return None

    return LLMProviderUsage(
        prompt_tokens=prompt_tokens if isinstance(prompt_tokens, int) else None,
        completion_tokens=completion_tokens if isinstance(completion_tokens, int) else None,
        total_tokens=total_tokens if isinstance(total_tokens, int) else None,
    )


class OpenAICompatibleLLMProvider(LLMProvider):
    def __init__(
        self,
        name: str,
        display_name: str,
        api_key: str,
        base_url: str,
        model: str,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.name = name
        self.display_name = display_name
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.transport = transport

    def _request_payload(self, request: LLMProviderChatRequest) -> dict[str, Any]:
        return {
            "model": self.model,
            "messages": [{"role": message.role, "content": message.content} for message in request.messages],
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "stream": request.stream,
            "stream_options": {"include_usage": True} if request.stream else None,
        }

    async def chat(self, request: LLMProviderChatRequest) -> LLMProviderChatResponse:
        async with httpx.AsyncClient(timeout=60, transport=self.transport) as client:
            response = await client.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=self._request_payload(request),
            )

        payload: Any = None
        try:
            payload = response.json()
        except Exception:
            payload = None

        if not response.is_success:
            raise ValueError(_get_provider_error_message(payload) or f"{self.display_name} 请求失败")

        content = _get_content(payload)
        if not content:
            raise ValueError(f"{self.display_name} 返回了空内容")

        return LLMProviderChatResponse(content=content, usage=_get_usage(payload))

    async def stream_chat(self, request: LLMProviderChatRequest) -> AsyncIterator[LLMProviderStreamEvent]:
        async with httpx.AsyncClient(timeout=60, transport=self.transport) as client:
            async with client.stream(
                "POST",
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=self._request_payload(LLMProviderChatRequest(**{**request.__dict__, "stream": True})),
            ) as response:
                if not response.is_success:
                    payload: Any = None
                    try:
                        await response.aread()
                        payload = response.json()
                    except Exception:
                        payload = None
                    raise ValueError(_get_provider_error_message(payload) or f"{self.display_name} 请求失败")

                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    raw = line.removeprefix("data:").strip()
                    if raw == "[DONE]":
                        break
                    try:
                        chunk = json.loads(raw)
                    except Exception:
                        continue

                    delta = ""
                    if _is_record(chunk):
                        choices = chunk.get("choices")
                        if isinstance(choices, list) and choices:
                            first_choice = choices[0]
                            if _is_record(first_choice):
                                delta_payload = first_choice.get("delta")
                                if _is_record(delta_payload) and isinstance(delta_payload.get("content"), str):
                                    delta = str(delta_payload["content"])

                    usage = _get_usage(chunk)
                    if delta or usage is not None:
                        yield LLMProviderStreamEvent(delta=delta, usage=usage)
