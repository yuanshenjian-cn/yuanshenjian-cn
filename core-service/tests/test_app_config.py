from __future__ import annotations

from app.shared.infra import app_config


def test_app_config_expands_env_placeholders_with_default() -> None:
    assert app_config._expand_env_placeholders("${AI_CHAT_DAILY_REQUEST_LIMIT:50}", {}) == "50"


def test_app_config_expands_env_placeholders_with_env_value() -> None:
    assert app_config._expand_env_placeholders("${AI_CHAT_DAILY_REQUEST_LIMIT:50}", {"AI_CHAT_DAILY_REQUEST_LIMIT": "88"}) == "88"


def test_app_config_expands_env_placeholders_with_default_for_empty_value() -> None:
    assert app_config._expand_env_placeholders("${AI_ACTIVE_PROFILE:deepseek/default}", {"AI_ACTIVE_PROFILE": ""}) == "deepseek/default"


def test_app_file_env_overrides_only_dynamic_runtime_values() -> None:
    file_config = app_config.AppFileConfig()
    resolved = app_config._apply_app_file_env_overrides(
        file_config,
        {
            "ALLOWED_ORIGINS_RAW": "https://example.com,https://admin.example.com",
            "COOKIE_DOMAIN": ".example.com",
            "AI_ACTIVE_PROFILE": "moonshot-cn/kimi-k2.6",
            "AI_CHAT_DAILY_REQUEST_LIMIT": "88",
        },
    )

    assert resolved.cors.allowed_origins == ["https://example.com", "https://admin.example.com"]
    assert resolved.security.cookie_domain == ".example.com"
    assert resolved.ai.active_profile == "moonshot-cn/kimi-k2.6"
    assert resolved.ai.chat_daily_request_limit == 88


def test_site_public_dir_is_derived_from_repo_root() -> None:
    settings = app_config.build_settings()
    assert settings.site_public_dir == settings.repo_root / "site" / "public"
