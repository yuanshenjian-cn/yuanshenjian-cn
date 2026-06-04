import asyncio

from app.shared.infra.in_memory_fallback_rate_limiter import InMemoryFallbackRateLimiter
from app.shared.infra.request_security import verify_origin
from app.shared.infra.secret_hash import create_secret_token, hash_with_pepper


def test_hash_with_pepper_is_stable_and_not_plaintext() -> None:
    value = hash_with_pepper("127.0.0.1", "pepper")
    assert value == hash_with_pepper("127.0.0.1", "pepper")
    assert value != "127.0.0.1"


def test_origin_must_be_allowed() -> None:
    verify_origin("https://yuanshenjian.cn", ["https://yuanshenjian.cn"])


def test_memory_fallback_rate_limiter_rejects_after_limit() -> None:
    async def run() -> None:
        limiter = InMemoryFallbackRateLimiter()
        assert (await limiter.check_and_hit_many("test", "visitor:a", [(2, 60)])).allowed is True
        assert (await limiter.check_and_hit_many("test", "visitor:a", [(2, 60)])).allowed is True
        assert (await limiter.check_and_hit_many("test", "visitor:a", [(2, 60)])).allowed is False

    asyncio.run(run())


def test_secret_token_has_enough_entropy() -> None:
    assert len(create_secret_token()) >= 43
