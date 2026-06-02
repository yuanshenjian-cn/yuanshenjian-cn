from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import yaml
from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field

CORE_SERVICE_ROOT = Path(__file__).resolve().parents[3]
REPO_ROOT = CORE_SERVICE_ROOT.parent
APP_CONFIG_PATH = CORE_SERVICE_ROOT / "app" / "application.yml"
ENV_PLACEHOLDER_PATTERN = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)(?::([^}]*))?\}")


def _current_app_env() -> str:
    value = os.environ.get("APP_ENV", "local").strip()
    return value or "local"


def _parse_bool(value: str | bool | None, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _parse_int(value: str | None, default: int) -> int:
    if value is None or not value.strip():
        return default
    return int(value)


def _parse_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _expand_env_placeholders(value: Any, env_map: dict[str, str]) -> Any:
    if isinstance(value, dict):
        return {key: _expand_env_placeholders(item, env_map) for key, item in value.items()}
    if isinstance(value, list):
        return [_expand_env_placeholders(item, env_map) for item in value]
    if not isinstance(value, str):
        return value

    def replace(match: re.Match[str]) -> str:
        env_name = match.group(1)
        default_value = match.group(2) if match.group(2) is not None else ""
        env_value = env_map.get(env_name)
        return env_value if env_value else default_value

    return ENV_PLACEHOLDER_PATTERN.sub(replace, value)


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in override.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            merged[key] = _deep_merge(current, value)
        else:
            merged[key] = value
    return merged


def _load_env_map(app_env: str) -> dict[str, str]:
    env_map: dict[str, str] = {}
    candidates = [
        CORE_SERVICE_ROOT / ".env",
        CORE_SERVICE_ROOT / ".env.local",
    ]
    if app_env != "local":
        candidates.insert(1, CORE_SERVICE_ROOT / f".env.{app_env}")
        candidates.append(CORE_SERVICE_ROOT / f".env.{app_env}.local")

    for file_path in candidates:
        if not file_path.exists():
            continue
        for key, value in dotenv_values(file_path).items():
            if value is not None:
                env_map[key] = value

    env_map.update(os.environ)
    env_map.setdefault("APP_ENV", app_env)
    return env_map


class CorsConfig(BaseModel):
    allowed_origins: list[str] = Field(default_factory=list)


class SecurityConfig(BaseModel):
    cookie_domain: str = ".yuanshenjian.cn"


class AIProfileDefaultsConfig(BaseModel):
    temperature: float = 0.2
    max_tokens: int = 1200


class AIProviderModelConfig(BaseModel):
    model_id: str = ""
    temperature: float | None = None
    max_tokens: int | None = None


class AIProviderConfig(BaseModel):
    base_url: str = ""
    api_key: str = Field(default="", repr=False)
    models: dict[str, AIProviderModelConfig] = Field(default_factory=dict)


class AIConfig(BaseModel):
    active_profile: str = "deepseek/deepseek-v4-flash"
    profile_defaults: AIProfileDefaultsConfig = Field(default_factory=AIProfileDefaultsConfig)
    providers: dict[str, AIProviderConfig] = Field(default_factory=dict)
    scene_profiles: dict[str, str] = Field(default_factory=lambda: {"default": "deepseek/deepseek-v4-flash"})
    global_daily_token_limit: int = 200_000
    chat_daily_request_limit: int = 50
    advisor_daily_request_limit: int = 30
    moderation_daily_request_limit: int = 200
    embedding_daily_token_limit: int = 100_000


class AppFileConfig(BaseModel):
    cors: CorsConfig = Field(default_factory=CorsConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    ai: AIConfig = Field(default_factory=AIConfig)


def _load_app_file_config(app_env: str, env_map: dict[str, str]) -> AppFileConfig:
    raw = yaml.safe_load(APP_CONFIG_PATH.read_text(encoding="utf-8")) if APP_CONFIG_PATH.exists() else {}
    if not isinstance(raw, dict):
        raise RuntimeError(f"Invalid app config: {APP_CONFIG_PATH}")
    default_config = raw.get("default", {})
    env_config = raw.get(app_env, {})
    if not isinstance(default_config, dict) or not isinstance(env_config, dict):
        raise RuntimeError(f"Invalid environment sections in {APP_CONFIG_PATH}")
    merged_config = _deep_merge(default_config, env_config)
    return AppFileConfig.model_validate(_expand_env_placeholders(merged_config, env_map))


def _apply_app_file_env_overrides(file_config: AppFileConfig, env_map: dict[str, str]) -> AppFileConfig:
    data = file_config.model_dump()

    allowed_origins = env_map.get("ALLOWED_ORIGINS_RAW") or env_map.get("ALLOWED_ORIGINS")
    if allowed_origins:
        data["cors"]["allowed_origins"] = _parse_csv(allowed_origins)

    cookie_domain = env_map.get("COOKIE_DOMAIN")
    if cookie_domain is not None:
        data["security"]["cookie_domain"] = cookie_domain

    active_profile = env_map.get("AI_ACTIVE_PROFILE", "").strip()
    if active_profile:
        data["ai"]["active_profile"] = active_profile

    ai_int_overrides = {
        "global_daily_token_limit": "AI_GLOBAL_DAILY_TOKEN_LIMIT",
        "chat_daily_request_limit": "AI_CHAT_DAILY_REQUEST_LIMIT",
        "advisor_daily_request_limit": "AI_ADVISOR_DAILY_REQUEST_LIMIT",
        "moderation_daily_request_limit": "AI_MODERATION_DAILY_REQUEST_LIMIT",
        "embedding_daily_token_limit": "AI_EMBEDDING_DAILY_TOKEN_LIMIT",
    }
    for field_name, env_name in ai_int_overrides.items():
        data["ai"][field_name] = _parse_int(env_map.get(env_name), int(data["ai"][field_name]))

    return AppFileConfig.model_validate(data)


class Settings(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, extra="ignore")

    app_env: str = "local"
    public_site_url: str = "https://yuanshenjian.cn"
    api_public_base_url: str = "http://localhost:8000"
    allowed_origins_raw: str = ""
    cookie_domain_override: str = ""
    database_url: str = "sqlite+pysqlite:///./core-service/dev.db"
    session_secret: str = "dev-session-secret"
    admin_secret_hash: str = ""
    turnstile_secret_key: str = ""
    embedding_base_url: str = ""
    embedding_api_key: str = ""
    embedding_model_id: str = ""
    embedding_dimensions: int = 1536
    emergency_disable_ai: bool = False
    env_map: dict[str, str] = Field(default_factory=dict, exclude=True, repr=False)
    file_config: AppFileConfig = Field(default_factory=AppFileConfig, exclude=True, repr=False)
    core_service_root: Path = Field(default=CORE_SERVICE_ROOT, exclude=True, repr=False)
    repo_root: Path = Field(default=REPO_ROOT, exclude=True, repr=False)

    @property
    def allowed_origins(self) -> list[str]:
        if self.allowed_origins_raw.strip():
            return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]
        return self.file_config.cors.allowed_origins

    @property
    def cookie_domain(self) -> str:
        return self.cookie_domain_override or self.file_config.security.cookie_domain

    @property
    def ai_global_daily_token_limit(self) -> int:
        return self.file_config.ai.global_daily_token_limit

    @property
    def ai_chat_daily_request_limit(self) -> int:
        return self.file_config.ai.chat_daily_request_limit

    @property
    def ai_advisor_daily_request_limit(self) -> int:
        return self.file_config.ai.advisor_daily_request_limit

    @property
    def ai_moderation_daily_request_limit(self) -> int:
        return self.file_config.ai.moderation_daily_request_limit

    @property
    def ai_embedding_daily_token_limit(self) -> int:
        return self.file_config.ai.embedding_daily_token_limit

    @property
    def site_public_dir(self) -> Path:
        return self.repo_root / "site" / "public"

    @property
    def active_ai_profile(self) -> str:
        return self.file_config.ai.active_profile


def build_settings() -> Settings:
    app_env = _current_app_env()
    env_map = _load_env_map(app_env)
    file_config = _apply_app_file_env_overrides(_load_app_file_config(app_env, env_map), env_map)
    return Settings.model_validate(
        {
            "app_env": env_map.get("APP_ENV", app_env),
            "public_site_url": env_map.get("PUBLIC_SITE_URL", "https://yuanshenjian.cn"),
            "api_public_base_url": env_map.get("API_PUBLIC_BASE_URL", "http://localhost:8000"),
            "allowed_origins_raw": env_map.get("ALLOWED_ORIGINS_RAW", env_map.get("ALLOWED_ORIGINS", "")),
            "cookie_domain_override": env_map.get("COOKIE_DOMAIN", ""),
            "database_url": env_map.get("DATABASE_URL", "sqlite+pysqlite:///./core-service/dev.db"),
            "session_secret": env_map.get("SESSION_SECRET", "dev-session-secret"),
            "admin_secret_hash": env_map.get("ADMIN_SECRET_HASH", ""),
            "turnstile_secret_key": env_map.get("TURNSTILE_SECRET_KEY", ""),
            "embedding_base_url": env_map.get("EMBEDDING_BASE_URL", ""),
            "embedding_api_key": env_map.get("EMBEDDING_API_KEY", ""),
            "embedding_model_id": env_map.get("EMBEDDING_MODEL_ID", ""),
            "embedding_dimensions": int(env_map.get("EMBEDDING_DIMENSIONS", "1536")),
            "emergency_disable_ai": _parse_bool(env_map.get("EMERGENCY_DISABLE_AI"), default=False),
            "env_map": env_map,
            "file_config": file_config,
            "core_service_root": CORE_SERVICE_ROOT,
            "repo_root": REPO_ROOT,
        }
    )


settings = build_settings()
