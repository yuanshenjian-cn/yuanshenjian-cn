from __future__ import annotations

from app.contexts.ai_assistant.infra.providers.deepseek_llm_provider import DeepSeekLLMProvider
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProvider, LLMProviderProfile
from app.contexts.ai_assistant.infra.providers.moonshot_cn_llm_provider import MoonshotCnLLMProvider
from app.contexts.ai_assistant.infra.providers.openai_compatible_llm_provider import OpenAICompatibleLLMProvider
from app.contexts.ai_assistant.infra.providers.tencent_tokenhub_llm_provider import TencentTokenHubLLMProvider


def create_llm_provider(profile: LLMProviderProfile) -> LLMProvider:
    if profile.provider == "tencent-tokenhub":
        return TencentTokenHubLLMProvider(profile.api_key, profile.base_url, profile.model)
    if profile.provider == "deepseek":
        return DeepSeekLLMProvider(profile.api_key, profile.base_url, profile.model)
    if profile.provider == "moonshot-cn":
        return MoonshotCnLLMProvider(profile.api_key, profile.base_url, profile.model)
    if profile.provider == "openai-compatible":
        return OpenAICompatibleLLMProvider("openai-compatible", "OpenAI Compatible", profile.api_key, profile.base_url, profile.model)
    raise ValueError(f"未支持的 LLM provider：{profile.provider}")
