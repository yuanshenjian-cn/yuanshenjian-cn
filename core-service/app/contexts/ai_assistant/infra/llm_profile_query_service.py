from __future__ import annotations

from collections.abc import Callable
from typing import Any

from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProviderProfile
from app.shared.config import load_jsonc_file, settings


class LLMProfileQueryService:
    def load_supported_providers(self) -> set[str]:
        raw = load_jsonc_file(settings.supported_llm_providers_path)
        if not isinstance(raw, list):
            raise ValueError(f"Invalid supported providers config: {settings.supported_llm_providers_path}")
        providers = {str(item).strip() for item in raw if str(item).strip()}
        if not providers:
            raise ValueError("Supported provider list must not be empty")
        return providers

    def load_scene_profile_map(self) -> dict[str, str]:
        raw = load_jsonc_file(settings.scene_profile_map_path)
        if not isinstance(raw, dict):
            raise ValueError(f"Invalid scene profile map: {settings.scene_profile_map_path}")
        return {str(key): str(value) for key, value in raw.items() if str(value).strip()}

    def flatten_profiles_config(
        self,
        raw_config: dict[str, Any],
        supported_providers: set[str],
        secret_resolver: Callable[[str], str],
    ) -> dict[str, LLMProviderProfile]:
        version = raw_config.get("version")
        if version != 1:
            raise ValueError("LLM profiles config version must be 1")

        raw_providers = raw_config.get("providers")
        if not isinstance(raw_providers, dict):
            raise ValueError("LLM profiles config must contain providers object")

        profiles: dict[str, LLMProviderProfile] = {}
        for provider_name, provider_config in raw_providers.items():
            if provider_name not in supported_providers:
                raise ValueError(f"Unsupported provider in LLM profiles config: {provider_name}")
            if not isinstance(provider_config, dict):
                raise ValueError(f"Provider config must be an object: {provider_name}")

            base_url = str(provider_config.get("baseUrl") or "").strip()
            api_key_env = str(provider_config.get("apiKeyEnv") or "").strip()
            raw_models = provider_config.get("models")
            if not base_url:
                raise ValueError(f"Provider baseUrl is required: {provider_name}")
            if not api_key_env:
                raise ValueError(f"Provider apiKeyEnv is required: {provider_name}")
            if not isinstance(raw_models, dict):
                raise ValueError(f"Provider models must be an object: {provider_name}")

            for model_key, model_config in raw_models.items():
                if not isinstance(model_config, dict):
                    raise ValueError(f"Model config must be an object: {provider_name}/{model_key}")
                model_id = str(model_config.get("modelId") or "").strip()
                if not model_id:
                    raise ValueError(f"Model modelId is required: {provider_name}/{model_key}")

                selector = f"{provider_name}/{model_key}"
                profiles[selector] = LLMProviderProfile(
                    id=selector,
                    provider=provider_name,
                    base_url=base_url,
                    model=model_id,
                    api_key=secret_resolver(api_key_env),
                    api_key_env=api_key_env,
                    temperature=float(model_config.get("temperature") or 0.2),
                    max_tokens=int(model_config.get("maxTokens") or 1200),
                )

        return profiles

    def parse_profiles(self) -> dict[str, LLMProviderProfile]:
        raw = load_jsonc_file(settings.llm_profiles_path)
        if not isinstance(raw, dict):
            raise ValueError(f"Invalid LLM profiles config: {settings.llm_profiles_path}")
        return self.flatten_profiles_config(raw, self.load_supported_providers(), settings.get_secret)

    def resolve_scene_profile(self, scene: str, scene_map: dict[str, str], default: str = "default") -> str:
        return scene_map.get(scene) or scene_map.get("default", default)

    def resolve_active_profile(self, scene: str) -> LLMProviderProfile:
        scene_map = self.load_scene_profile_map()
        profiles = self.parse_profiles()
        selector = self.resolve_scene_profile(scene, scene_map, default=settings.default_ai_profile)
        profile = profiles.get(selector) or profiles.get(settings.default_ai_profile)
        if profile is not None:
            return profile
        return LLMProviderProfile(
            id="fallback",
            provider="openai-compatible",
            base_url="",
            model="fallback",
            api_key="",
            api_key_env="",
        )
