from app.shared.rate_limit import InMemoryRateLimiter
from app.shared.security import create_secret_token, hash_with_pepper, verify_origin


def test_hash_with_pepper_is_stable_and_not_plaintext() -> None:
    value = hash_with_pepper("127.0.0.1", "pepper")
    assert value == hash_with_pepper("127.0.0.1", "pepper")
    assert value != "127.0.0.1"


def test_origin_must_be_allowed() -> None:
    verify_origin("https://yuanshenjian.cn", ["https://yuanshenjian.cn"])


def test_rate_limiter_rejects_after_limit() -> None:
    limiter = InMemoryRateLimiter(limit=2)
    assert limiter.hit("visitor:a") is True
    assert limiter.hit("visitor:a") is True
    assert limiter.hit("visitor:a") is False


def test_secret_token_has_enough_entropy() -> None:
    assert len(create_secret_token()) >= 43
