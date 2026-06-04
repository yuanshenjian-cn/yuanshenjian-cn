from __future__ import annotations

from datetime import UTC, datetime, timedelta
from collections.abc import Awaitable
from typing import Any, Protocol, cast

from app.shared.infra.short_window_rate_limiter import RateLimitDecision


class RedisScriptClient(Protocol):
    def eval(self, script: str, numkeys: int, *keys_and_args: Any) -> Awaitable[Any]: ...


RATE_LIMIT_SCRIPT = """
for i,key in ipairs(KEYS) do
  local count = tonumber(redis.call('GET', key) or '0')
  local limit = tonumber(ARGV[i])
  if count >= limit then
    return {0, count, tonumber(ARGV[#KEYS + i])}
  end
end
local min_remaining = nil
local min_ttl = nil
for i,key in ipairs(KEYS) do
  local next_count = redis.call('INCR', key)
  local window_seconds = tonumber(ARGV[#KEYS + i])
  if next_count == 1 then
    redis.call('EXPIRE', key, window_seconds)
  end
  local remaining = tonumber(ARGV[i]) - next_count
  if min_remaining == nil or remaining < min_remaining then
    min_remaining = remaining
  end
  if min_ttl == nil or window_seconds < min_ttl then
    min_ttl = window_seconds
  end
end
return {1, min_remaining or 0, min_ttl or 0}
"""


class RenderKeyValueRateLimiter:
    def __init__(self, client: RedisScriptClient) -> None:
        self._client = client

    async def check_and_hit_many(
        self,
        policy_key: str,
        subject_key: str,
        windows: list[tuple[int, int]],
    ) -> RateLimitDecision:
        if not windows:
            return RateLimitDecision(allowed=True, remaining=None, reset_at=None, backend="key_value")

        normalized_windows = sorted(windows, key=lambda item: item[1])
        keys = [f"rl:{policy_key}:{subject_key}:{window_seconds}" for _, window_seconds in normalized_windows]
        limits = [limit for limit, _ in normalized_windows]
        window_seconds_values = [window_seconds for _, window_seconds in normalized_windows]
        raw_result = await self._client.eval(
            RATE_LIMIT_SCRIPT,
            len(keys),
            *keys,
            *limits,
            *window_seconds_values,
        )
        result = cast(list[object], raw_result)
        allowed = int(str(result[0])) == 1
        remaining = int(str(result[1])) if len(result) > 1 else None
        reset_after_seconds = int(str(result[2])) if len(result) > 2 else None
        reset_at = (
            datetime.now(UTC) + timedelta(seconds=reset_after_seconds)
            if reset_after_seconds is not None and reset_after_seconds > 0
            else None
        )
        return RateLimitDecision(
            allowed=allowed,
            remaining=remaining,
            reset_at=reset_at,
            backend="key_value",
        )
