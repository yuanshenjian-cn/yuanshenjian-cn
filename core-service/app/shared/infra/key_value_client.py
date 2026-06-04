from __future__ import annotations

from typing import Any

import redis.asyncio as redis

from app.shared.infra.app_config import settings

_client: redis.Redis | None = None


def get_key_value_client() -> redis.Redis | None:
    global _client
    if not settings.key_value_url.strip():
        return None
    if _client is None:
        _client = redis.from_url(settings.key_value_url, decode_responses=True)
    return _client


async def close_key_value_client() -> None:
    global _client
    if _client is None:
        return
    client: Any = _client
    _client = None
    await client.aclose()
