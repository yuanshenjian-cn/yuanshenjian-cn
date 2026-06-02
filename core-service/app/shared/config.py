from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import yaml
from dotenv import dotenv_values
from pydantic import BaseModel, ConfigDict, Field

CORE_SERVICE_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = CORE_SERVICE_ROOT.parent
APP_CONFIG_PATH = CORE_SERVICE_ROOT / "config" / "app.yaml"


def _current_app_env() -> str:
    value = os.environ.get("APP_ENV", "development").strip()
    return value or "development"


def _parse_bool(value: str | bool | None, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    merged = dict(base)
    for key, value in override.items():
        current = merged.get(key)
        if isinstance(current, dict) and isinstance(value, dict):
            merged[key] = _deep_merge(current, value)
        else:
            merged[key] = value
    return merged


def _strip_json_comments(source: str) -> str:
    result: list[str] = []
    in_string = False
    in_line_comment = False
    in_block_comment = False
    escaped = False
    index = 0

    while index < len(source):
        character = source[index]
        next_character = source[index + 1] if index + 1 < len(source) else ""

        if in_line_comment:
            if character == "\n":
                in_line_comment = False
                result.append(character)
            index += 1
            continue

        if in_block_comment:
            if character == "*" and next_character == "/":
                in_block_comment = False
                index += 2
                continue
            if character == "\n":
                result.append(character)
            index += 1
            continue

        if in_string:
            result.append(character)
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                in_string = False
            index += 1
            continue

        if character == '"':
            in_string = True
            result.append(character)
            index += 1
            continue

        if character == "/" and next_character == "/":
            in_line_comment = True
            index += 2
            continue

        if character == "/" and next_character == "*":
            in_block_comment = True
            index += 2
            continue

        result.append(character)
        index += 1

    return "".join(result)


def _strip_trailing_commas(source: str) -> str:
    result: list[str] = []
    in_string = False
    escaped = False

    for character in source:
        if in_string:
            result.append(character)
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                in_string = False
            continue

        if character == '"':
            in_string = True
            result.append(character)
            continue

        if character in {"}", "]"}:
            last_index = len(result) - 1
            while last_index >= 0 and result[last_index].isspace():
                last_index -= 1
            if last_index >= 0 and result[last_index] == ",":
                result.pop(last_index)

        result.append(character)

    return "".join(result)


def load_jsonc_file(file_path: Path) -> Any:
    if not file_path.exists():
        return None
    source = file_path.read_text(encoding="utf-8")
    cleaned = _strip_trailing_commas(_strip_json_comments(source))
    return json.loads(cleaned)


def _load_env_map(app_env: str) -> dict[str, str]:
    env_map: dict[str, str] = {}
    candidates = [
        CORE_SERVICE_ROOT / ".env",
        CORE_SERVICE_ROOT / f".env.{app_env}",
        CORE_SERVICE_ROOT / ".env.local",
        CORE_SERVICE_ROOT / f".env.{app_env}.local",
    ]

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


class AIConfig(BaseModel):
    supported_providers_file: str = "config/ai/supported-llm-providers.json"
    llm_profiles_file: str = "config/ai/llm-profiles.jsonc"
    scene_profile_map_file: str = "config/ai/scene-profile-map.jsonc"
    legacy_public_data_dir: str = "../site/public"
    default_active_profile: str = "deepseek/deepseek-v4-flash"
    global_daily_token_limit: int = 200_000
    chat_daily_request_limit: int = 50
    advisor_daily_request_limit: int = 30
    moderation_daily_request_limit: int = 200
    embedding_daily_token_limit: int = 100_000


class AppFileConfig(BaseModel):
    cors: CorsConfig = Field(default_factory=CorsConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    ai: AIConfig = Field(default_factory=AIConfig)


def _load_app_file_config(app_env: str) -> AppFileConfig:
    raw = yaml.safe_load(APP_CONFIG_PATH.read_text(encoding="utf-8")) if APP_CONFIG_PATH.exists() else {}
    if not isinstance(raw, dict):
        raise RuntimeError(f"Invalid app config: {APP_CONFIG_PATH}")
    default_config = raw.get("default", {})
    env_config = raw.get(app_env, {})
    if not isinstance(default_config, dict) or not isinstance(env_config, dict):
        raise RuntimeError(f"Invalid environment sections in {APP_CONFIG_PATH}")
    return AppFileConfig.model_validate(_deep_merge(default_config, env_config))


class Settings(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True, extra="ignore")

    app_env: str = "development"
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
    def supported_llm_providers_path(self) -> Path:
        return self._resolve_core_path(self.file_config.ai.supported_providers_file)

    @property
    def llm_profiles_path(self) -> Path:
        return self._resolve_core_path(self.file_config.ai.llm_profiles_file)

    @property
    def scene_profile_map_path(self) -> Path:
        return self._resolve_core_path(self.file_config.ai.scene_profile_map_file)

    @property
    def site_public_dir(self) -> Path:
        return self._resolve_core_path(self.file_config.ai.legacy_public_data_dir)

    @property
    def default_ai_profile(self) -> str:
        return self.file_config.ai.default_active_profile

    def get_secret(self, env_name: str) -> str:
        return self.env_map.get(env_name, "").strip()

    def _resolve_core_path(self, raw_path: str) -> Path:
        path = Path(raw_path)
        return path if path.is_absolute() else self.core_service_root / path


def build_settings() -> Settings:
    app_env = _current_app_env()
    env_map = _load_env_map(app_env)
    file_config = _load_app_file_config(app_env)
    return Settings.model_validate(
        {
            "app_env": env_map.get("APP_ENV", app_env),
            "public_site_url": env_map.get("PUBLIC_SITE_URL", "https://yuanshenjian.cn"),
            "api_public_base_url": env_map.get("API_PUBLIC_BASE_URL", "http://localhost:8000"),
            "allowed_origins_raw": env_map.get("ALLOWED_ORIGINS_RAW", ""),
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
