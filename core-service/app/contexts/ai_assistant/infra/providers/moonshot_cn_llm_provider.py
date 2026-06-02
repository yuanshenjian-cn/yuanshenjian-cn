from __future__ import annotations

from app.contexts.ai_assistant.infra.providers.openai_compatible_llm_provider import OpenAICompatibleLLMProvider


class MoonshotCnLLMProvider(OpenAICompatibleLLMProvider):
    def __init__(self, api_key: str, base_url: str, model: str) -> None:
        super().__init__("moonshot-cn", "Moonshot CN", api_key, base_url, model)
