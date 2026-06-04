from __future__ import annotations

from datetime import UTC, datetime
from urllib.parse import urlparse

from fastapi import Request, Response

from app.shared.domain.request_subject import RequestSubject, VisitorTokenStatus
from app.shared.infra.app_config import settings
from app.shared.infra.secret_hash import create_secret_token, hash_with_pepper
from app.shared.infra.signed_visitor_token import (
    VISITOR_COOKIE,
    VISITOR_COOKIE_MAX_AGE_SECONDS,
    issue_signed_visitor_token,
    verify_signed_visitor_token,
)


def trusted_custom_hosts() -> set[str]:
    hosts: set[str] = set()
    for url in [settings.api_public_base_url, *settings.allowed_origins]:
        parsed = urlparse(url)
        if parsed.hostname:
            hosts.add(parsed.hostname)
    return hosts


def request_host(request: Request) -> str:
    return request.url.hostname or request.headers.get("host", "").split(":", 1)[0]


def is_direct_origin_request(request: Request) -> bool:
    return request_host(request) not in trusted_custom_hosts()


def resolve_request_ip(request: Request) -> str:
    socket_ip = request.client.host if request.client else "unknown"
    if (
        settings.app_env == "production"
        and settings.trust_cf_connecting_ip
        and not is_direct_origin_request(request)
    ):
        return request.headers.get("cf-connecting-ip") or socket_ip
    return socket_ip


class RequestIdentityResolver:
    async def resolve_public_subject(
        self,
        request: Request,
        response: Response | None = None,
    ) -> RequestSubject:
        raw_ip = resolve_request_ip(request)
        direct_origin = is_direct_origin_request(request)
        visitor_key, token_status = self._resolve_visitor_key(request)
        if response is not None and token_status != "valid":
            self._set_signed_visitor_cookie(response, visitor_key)

        return RequestSubject(
            raw_ip=raw_ip,
            ip_hash=hash_with_pepper(raw_ip, settings.session_secret),
            user_agent_hash=hash_with_pepper(
                request.headers.get("user-agent", "unknown"),
                settings.session_secret,
            ),
            visitor_key=visitor_key,
            visitor_key_hash=hash_with_pepper(visitor_key, settings.session_secret),
            visitor_token_status=token_status,
            direct_origin=direct_origin,
        )

    def _resolve_visitor_key(self, request: Request) -> tuple[str, VisitorTokenStatus]:
        cookie_value = request.cookies.get(VISITOR_COOKIE)
        if not cookie_value:
            return create_secret_token(), "missing"

        verified = verify_signed_visitor_token(cookie_value)
        if verified is not None:
            return verified.visitor_key, "valid"

        if "." not in cookie_value:
            return cookie_value, "legacy"
        return create_secret_token(), "invalid"

    def _set_signed_visitor_cookie(self, response: Response, visitor_key: str) -> None:
        response.set_cookie(
            VISITOR_COOKIE,
            issue_signed_visitor_token(visitor_key, datetime.now(UTC)),
            httponly=True,
            secure=settings.app_env == "production",
            samesite="lax",
            domain=settings.cookie_domain if settings.app_env == "production" else None,
            path="/",
            max_age=VISITOR_COOKIE_MAX_AGE_SECONDS,
        )
