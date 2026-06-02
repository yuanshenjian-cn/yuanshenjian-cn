from __future__ import annotations

from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProviderProfile
from app.shared.infra.app_config import AIConfig, settings


class LLMProfileQueryService:
    def load_scene_llm_profile_mapping(self) -> dict[str, str]:
        return {str(key): str(value) for key, value in settings.file_config.ai.scene_profiles.items() if str(value).strip()}

    def flatten_profiles_config(self, ai_config: AIConfig) -> dict[str, LLMProviderProfile]:
        profiles: dict[str, LLMProviderProfile] = {}
        for provider_name, provider_config in ai_config.providers.items():
            base_url = provider_config.base_url.strip()
            if not base_url:
                raise ValueError(f"Provider baseUrl is required: {provider_name}")
            if not provider_config.models:
                raise ValueError(f"Provider models must be an object: {provider_name}")

            for model_key, model_config in provider_config.models.items():
                selector = f"{provider_name}/{model_key}"
                model_id = model_config.model_id.strip() or str(model_key)
                profiles[selector] = LLMProviderProfile(
                    id=selector,
                    provider=provider_name,
                    base_url=base_url,
                    model=model_id,
                    api_key=provider_config.api_key.strip(),
                    temperature=(model_config.temperature if model_config.temperature is not None else ai_config.profile_defaults.temperature),
                    max_tokens=(model_config.max_tokens if model_config.max_tokens is not None else ai_config.profile_defaults.max_tokens),
                )

        return profiles

    def parse_profiles(self) -> dict[str, LLMProviderProfile]:
        profiles = self.flatten_profiles_config(settings.file_config.ai)
        if not profiles:
            raise ValueError("LLM profiles config must contain at least one profile")
        return profiles

    def resolve_scene_profile(self, scene: str, scene_map: dict[str, str], default: str = "default") -> str:
        return scene_map.get(scene) or scene_map.get("default", default)

    def resolve_active_profile(self, scene: str) -> LLMProviderProfile:
        scene_map = self.load_scene_llm_profile_mapping()
        profiles = self.parse_profiles()
        selector = self.resolve_scene_profile(scene, scene_map, default=settings.active_ai_profile)
        profile = profiles.get(selector) or profiles.get(settings.active_ai_profile)
        if profile is not None:
            return profile
        return LLMProviderProfile(
            id="fallback",
            provider="openai-compatible",
            base_url="",
            model="fallback",
            api_key="",
        )
