from __future__ import annotations

from app.contexts.ai_assistant.domain.llm_profile import LLMProfile
from app.contexts.ai_assistant.infra.providers.deepseek_llm_provider import DeepSeekLLMProvider
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProvider
from app.contexts.ai_assistant.infra.providers.moonshot_cn_llm_provider import MoonshotCnLLMProvider
from app.contexts.ai_assistant.infra.providers.openai_compatible_llm_provider import OpenAICompatibleLLMProvider


def create_llm_provider(profile: LLMProfile) -> LLMProvider:
    if profile.provider == "deepseek":
        return DeepSeekLLMProvider(profile.api_key, profile.base_url, profile.model)
    if profile.provider == "moonshot-cn":
        return MoonshotCnLLMProvider(profile.api_key, profile.base_url, profile.model)
    if profile.provider == "openai-compatible":
        return OpenAICompatibleLLMProvider("openai-compatible", "OpenAI Compatible", profile.api_key, profile.base_url, profile.model)
    raise ValueError(f"未支持的 LLM provider：{profile.provider}")
