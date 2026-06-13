import asyncio

import pytest

from app.contexts.ai_assistant.infra import published_ai_asset_query_service
from app.contexts.ai_assistant.infra.llm_profile_query_service import LLMProfileQueryService
from app.contexts.ai_assistant.infra.published_ai_asset_query_service import PublishedAIAssetQueryService
from app.contexts.ai_assistant.infra.providers.llm_provider import LLMProviderChatRequest, LLMProviderProfile, LLMProviderStreamEvent, LLMProviderUsage
from app.contexts.ai_assistant.infra.llm_stream_service import LLMStreamService
from app.contexts.ai_assistant.infra.sse_event_codec import encode_sse_event
from app.shared.infra import app_config
from app.shared.infra.app_config import settings


def test_encode_sse_outputs_event_and_json_data() -> None:
    assert encode_sse_event("done", {"ok": True}) == 'event: done\ndata: {"ok":true}\n\n'


def test_ai_config_uses_config_yml_profiles() -> None:
    assert settings.core_service_root.name == "core-service"
    assert "deepseek" in settings.file_config.ai.providers
    assert settings.file_config.ai.scene_profiles["advisor"] == "deepseek/deepseek-v4-pro"
    assert settings.file_config.ai.scene_profiles["contextual_ai_advisor"] == "deepseek/deepseek-v4-pro"


def test_scene_llm_profile_mapping_resolves_specific_profile() -> None:
    profile_id = LLMProfileQueryService().resolve_scene_profile("advisor", {"advisor": "advisor-profile"}, default="default")
    assert profile_id == "advisor-profile"


def test_scene_llm_profile_mapping_falls_back_to_map_default_first() -> None:
    profile_id = LLMProfileQueryService().resolve_scene_profile(
        "missing-scene",
        {"default": "deepseek/deepseek-v4-flash"},
        default="fallback",
    )
    assert profile_id == "deepseek/deepseek-v4-flash"


def test_flatten_profiles_config_builds_selector_based_profiles() -> None:
    profiles = LLMProfileQueryService().flatten_profiles_config(
        app_config.AIConfig.model_validate(
            {
                "providers": {
                    "deepseek": {
                        "base_url": "https://api.deepseek.com/v1",
                        "api_key": "secret-for:DEEPSEEK_API_KEY",
                        "models": {
                            "deepseek-v4-flash": {
                                "temperature": 0.1,
                                "max_tokens": 900,
                            }
                        },
                    }
                }
            }
        )
    )

    profile = profiles["deepseek/deepseek-v4-flash"]
    assert profile.provider == "deepseek"
    assert profile.model == "deepseek-v4-flash"
    assert profile.api_key == "secret-for:DEEPSEEK_API_KEY"
    assert profile.temperature == pytest.approx(0.1)
    assert profile.max_tokens == 900


def test_flatten_profiles_config_accepts_optional_model_id_alias() -> None:
    profiles = LLMProfileQueryService().flatten_profiles_config(
        app_config.AIConfig.model_validate(
            {
                "providers": {
                    "deepseek": {
                        "base_url": "https://api.deepseek.com/v1",
                        "api_key": "test-key",
                        "models": {
                            "fast": {"model_id": "deepseek-v4-flash"}
                        },
                    },
                }
            }
        )
    )

    profile = profiles["deepseek/fast"]
    assert profile.model == "deepseek-v4-flash"


def test_published_ai_asset_query_service_reads_remote_assets_in_production(monkeypatch: pytest.MonkeyPatch) -> None:
    requested_urls: list[str] = []

    class StubResponse:
        status_code = 200

        def json(self) -> dict[str, object]:
            return {
                "posts": [
                    {
                        "slug": "demo",
                        "title": "Demo",
                        "excerpt": "Demo excerpt",
                        "tags": ["AI"],
                        "date": "2026-06-02",
                    }
                ]
            }

    def fake_get(url: str, timeout: int, follow_redirects: bool) -> StubResponse:
        requested_urls.append(url)
        return StubResponse()

    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "public_site_url", "https://example.com")
    monkeypatch.setattr(published_ai_asset_query_service.httpx, "get", fake_get)

    candidates = PublishedAIAssetQueryService().load_article_recommendation_candidates()

    assert requested_urls == ["https://example.com/ai-data/index.json"]
    assert candidates[0].slug == "demo"


def test_llm_stream_service_uses_provider_stream() -> None:
    requests: list[LLMProviderChatRequest] = []

    class StubProvider:
        name = "stub"

        async def chat(self, request: LLMProviderChatRequest):
            raise AssertionError("stream_chat_completion should use stream path")

        async def stream_chat(self, request: LLMProviderChatRequest):
            requests.append(request)
            yield LLMProviderStreamEvent(delta="你好")
            yield LLMProviderStreamEvent(usage=LLMProviderUsage(prompt_tokens=11, completion_tokens=22, total_tokens=33))

    profile = LLMProviderProfile(
        id="deepseek/deepseek-v4-flash",
        provider="deepseek",
        base_url="https://example.com/v1",
        model="deepseek-v4-flash",
        api_key="test-key",
    )
    stream_service = LLMStreamService()

    async def collect() -> list[str]:
        return [
            event
            async for event in stream_service.stream_completion(
                profile,
                "系统提示",
                "测试问题",
                [{"id": "1"}],
                provider=StubProvider(),
            )
        ]

    events = asyncio.run(collect())

    assert requests[0].messages[0].role == "system"
    assert requests[0].messages[0].content == "系统提示"
    assert requests[0].messages[1].content == "测试问题"
    assert any('event: answer-delta\ndata: {"delta":"你好"}' in event for event in events)
    assert any('event: references\ndata: {"references":[{"id":"1"}]}' in event for event in events)
    assert any('event: done\ndata: {"usage":{"promptTokens":11,"completionTokens":22,"totalTokens":33}}' in event for event in events)
