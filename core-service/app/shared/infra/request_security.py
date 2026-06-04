from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import HTTPException, Request

from app.shared.infra.app_config import settings
from app.shared.infra.request_identity_resolver import resolve_request_ip
from app.shared.infra.secret_hash import hash_with_pepper

TURNSTILE_ACTIONS = {
    "article_recommendation": "homepage_article_recommendation",
    "article": "article_page_ai",
    "author": "author_page_ai",
    "ai_briefing_recommendation": "ai_briefing_recommendation",
    "investment_briefing_recommendation": "investment_briefing_recommendation",
    "advisor": "ai_advisor",
    "comment-submit": "comment_submit",
    "admin-login": "admin_login",
}


def verify_origin(origin: str | None, allowed_origins: list[str]) -> None:
    if origin is None and settings.app_env != "production":
        return
    if origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="origin_not_allowed")


def turnstile_action_for_scene(scene: str) -> str:
    return TURNSTILE_ACTIONS.get(scene, f"ai_{scene}")


def hash_request_ip(request: Request) -> str:
    return hash_with_pepper(resolve_request_ip(request), settings.session_secret)


def hash_user_agent(request: Request) -> str:
    return hash_with_pepper(request.headers.get("user-agent", "unknown"), settings.session_secret)


def normalize_referrer_origin(referrer: str | None) -> str | None:
    if not referrer:
        return None
    try:
        parsed = urlparse(referrer)
        if not parsed.scheme or not parsed.netloc:
            return None
        return f"{parsed.scheme}://{parsed.netloc}"
    except ValueError:
        return None


async def verify_turnstile(token: str, expected_action: str | None, remote_ip: str | None) -> bool:
    if not settings.turnstile_secret_key:
        return settings.app_env != "production"
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data={"secret": settings.turnstile_secret_key, "response": token, "remoteip": remote_ip or ""},
        )
    payload = response.json()
    if not payload.get("success"):
        return False
    if expected_action and payload.get("action") != expected_action:
        return False
    hostname = payload.get("hostname")
    if settings.app_env == "production" and hostname:
        allowed_hosts = {origin.removeprefix("https://").removeprefix("http://") for origin in settings.allowed_origins}
        if hostname not in allowed_hosts:
            return False
    if settings.app_env == "production" and not hostname:
        return False
    return True
