from __future__ import annotations

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.config import settings
from app.shared.infra.persistence.models import AdminSession, Visitor

VISITOR_COOKIE = "visitor_id"
ADMIN_COOKIE = "admin_session"
CSRF_COOKIE = "csrf_token"


@dataclass(frozen=True)
class Actor:
    actor_type: str
    visitor_id: str | None = None
    user_id: str | None = None


def create_secret_token() -> str:
    return secrets.token_urlsafe(32)


def hash_with_pepper(value: str, pepper: str) -> str:
    return hmac.new(pepper.encode(), value.encode(), hashlib.sha256).hexdigest()


def verify_origin(origin: str | None, allowed_origins: list[str]) -> None:
    if origin is None and settings.app_env != "production":
        return
    if origin not in allowed_origins:
        raise HTTPException(status_code=403, detail="origin_not_allowed")


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


def turnstile_action_for_scene(scene: str) -> str:
    return TURNSTILE_ACTIONS.get(scene, f"ai_{scene}")


def hash_request_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
    host = forwarded or (request.client.host if request.client else "unknown")
    return hash_with_pepper(host, settings.session_secret)


def hash_user_agent(request: Request) -> str:
    return hash_with_pepper(request.headers.get("user-agent", "unknown"), settings.session_secret)


def normalize_referrer_origin(referrer: str | None) -> str | None:
    if not referrer:
        return None
    try:
        from urllib.parse import urlparse

        parsed = urlparse(referrer)
        if not parsed.scheme or not parsed.netloc:
            return None
        return f"{parsed.scheme}://{parsed.netloc}"
    except ValueError:
        return None


def _coerce_utc_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def ensure_visitor(session: Session, request: Request, response: Response) -> Visitor:
    visitor_token = request.cookies.get(VISITOR_COOKIE) or create_secret_token()
    visitor_hash = hash_with_pepper(visitor_token, settings.session_secret)
    visitor = session.scalar(select(Visitor).where(Visitor.visitor_key_hash == visitor_hash))
    if visitor is None:
        visitor = Visitor(visitor_key_hash=visitor_hash)
        session.add(visitor)
        session.commit()
        session.refresh(visitor)
    else:
        visitor.last_seen_at = datetime.now(UTC)
        session.commit()

    if request.cookies.get(VISITOR_COOKIE) is None:
        response.set_cookie(
            VISITOR_COOKIE,
            visitor_token,
            httponly=True,
            secure=settings.app_env == "production",
            samesite="lax",
            domain=settings.cookie_domain if settings.app_env == "production" else None,
            path="/",
            max_age=60 * 60 * 24 * 365,
        )
    return visitor


def get_actor(session: Session, request: Request, response: Response) -> Actor:
    visitor = ensure_visitor(session, request, response)
    return Actor(actor_type="visitor", visitor_id=visitor.id)


def issue_admin_session(session: Session, response: Response) -> str:
    raw_token = create_secret_token()
    session_hash = hash_with_pepper(raw_token, settings.session_secret)
    admin_session = AdminSession(
        session_hash=session_hash,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    session.add(admin_session)
    session.commit()
    response.set_cookie(
        ADMIN_COOKIE,
        raw_token,
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        domain=settings.cookie_domain if settings.app_env == "production" else None,
        path="/api/v1/admin",
        max_age=60 * 60 * 24 * 7,
    )
    csrf_token = create_secret_token()
    response.set_cookie(
        CSRF_COOKIE,
        csrf_token,
        httponly=False,
        secure=settings.app_env == "production",
        samesite="lax",
        domain=settings.cookie_domain if settings.app_env == "production" else None,
        path="/",
        max_age=60 * 60 * 24 * 7,
    )
    return csrf_token


def require_admin(session: Session, request: Request) -> None:
    raw_token = request.cookies.get(ADMIN_COOKIE)
    if not raw_token:
        raise HTTPException(status_code=401, detail="admin_session_required")
    session_hash = hash_with_pepper(raw_token, settings.session_secret)
    admin_session = session.scalar(select(AdminSession).where(AdminSession.session_hash == session_hash))
    if admin_session is None or _coerce_utc_datetime(admin_session.expires_at) < datetime.now(UTC):
        raise HTTPException(status_code=401, detail="admin_session_invalid")
    admin_session.last_seen_at = datetime.now(UTC)
    session.commit()


def require_csrf(request: Request) -> None:
    cookie_token = request.cookies.get(CSRF_COOKIE)
    header_token = request.headers.get("x-csrf-token")
    if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
        raise HTTPException(status_code=403, detail="csrf_invalid")


def verify_admin_password(password: str) -> bool:
    if not settings.admin_secret_hash:
        return False
    password_hash = hash_with_pepper(password, settings.session_secret)
    return hmac.compare_digest(password_hash, settings.admin_secret_hash)


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
