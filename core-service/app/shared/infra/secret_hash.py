from __future__ import annotations

import hashlib
import hmac
import secrets


def create_secret_token() -> str:
    return secrets.token_urlsafe(32)


def hash_with_pepper(value: str, pepper: str) -> str:
    return hmac.new(pepper.encode(), value.encode(), hashlib.sha256).hexdigest()
