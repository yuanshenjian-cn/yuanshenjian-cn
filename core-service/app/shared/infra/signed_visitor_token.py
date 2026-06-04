from __future__ import annotations

import base64
import hashlib
import hmac
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from app.shared.infra.app_config import settings

VISITOR_COOKIE = "visitor_id"
VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365


@dataclass(frozen=True)
class VerifiedVisitorToken:
    visitor_key: str
    issued_at: datetime


def _encode_json_payload(payload: dict[str, object]) -> str:
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _decode_json_payload(payload_part: str) -> dict[str, Any] | None:
    padding = "=" * (-len(payload_part) % 4)
    try:
        decoded = base64.urlsafe_b64decode(f"{payload_part}{padding}".encode())
        payload = json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return None
    return payload if isinstance(payload, dict) else None


def _sign_payload_part(payload_part: str, secret: str) -> str:
    digest = hmac.new(secret.encode(), payload_part.encode(), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode().rstrip("=")


def issue_signed_visitor_token(
    visitor_key: str,
    issued_at: datetime,
    secret: str | None = None,
) -> str:
    payload_part = _encode_json_payload(
        {
            "iat": int(issued_at.timestamp()),
            "v": 1,
            "vid": visitor_key,
        }
    )
    return f"{payload_part}.{_sign_payload_part(payload_part, secret or settings.session_secret)}"


def verify_signed_visitor_token(token: str, secret: str | None = None) -> VerifiedVisitorToken | None:
    try:
        payload_part, signature_part = token.split(".", 1)
    except ValueError:
        return None

    expected_signature = _sign_payload_part(payload_part, secret or settings.session_secret)
    if not hmac.compare_digest(signature_part, expected_signature):
        return None

    payload = _decode_json_payload(payload_part)
    if payload is None or payload.get("v") != 1:
        return None
    visitor_key = payload.get("vid")
    issued_at_timestamp = payload.get("iat")
    if not isinstance(visitor_key, str) or not visitor_key:
        return None
    if not isinstance(issued_at_timestamp, int):
        return None
    return VerifiedVisitorToken(
        visitor_key=visitor_key,
        issued_at=datetime.fromtimestamp(issued_at_timestamp, UTC),
    )
