from __future__ import annotations

import asyncio
from collections.abc import Mapping
from datetime import UTC, datetime
from http.cookies import SimpleCookie

from fastapi import Request, Response
from pytest import MonkeyPatch

from app.shared.infra.app_config import settings
from app.shared.infra.request_identity_resolver import RequestIdentityResolver, resolve_request_ip
from app.shared.infra.secret_hash import hash_with_pepper
from app.shared.infra.signed_visitor_token import VISITOR_COOKIE, issue_signed_visitor_token


def build_request(
    *,
    host: str = "api.yuanshenjian.cn",
    headers: Mapping[str, str] | None = None,
    cookies: Mapping[str, str] | None = None,
    client_host: str = "5.5.5.5",
) -> Request:
    raw_headers = [(b"host", host.encode())]
    for key, value in (headers or {}).items():
        raw_headers.append((key.lower().encode(), value.encode()))
    if cookies:
        cookie = SimpleCookie()
        for key, value in cookies.items():
            cookie[key] = value
        raw_headers.append((b"cookie", cookie.output(header="", sep=";").strip().encode()))

    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": raw_headers,
            "client": (client_host, 12345),
            "scheme": "https",
            "server": (host, 443),
        }
    )


def test_public_subject_prefers_cf_connecting_ip_on_custom_domain(monkeypatch: MonkeyPatch) -> None:
    async def run() -> None:
        monkeypatch.setattr(settings, "app_env", "production")
        monkeypatch.setattr(settings, "api_public_base_url", "https://api.yuanshenjian.cn")
        monkeypatch.setattr(settings, "trust_cf_connecting_ip", True)
        request = build_request(
            headers={"cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9"}
        )

        subject = await RequestIdentityResolver().resolve_public_subject(request, Response())

        assert subject.raw_ip == "1.2.3.4"
        assert subject.ip_hash == hash_with_pepper("1.2.3.4", settings.session_secret)

    asyncio.run(run())


def test_public_subject_ignores_x_forwarded_for_when_cf_not_trusted(monkeypatch: MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "api_public_base_url", "https://api.yuanshenjian.cn")
    monkeypatch.setattr(settings, "trust_cf_connecting_ip", False)
    request = build_request(headers={"cf-connecting-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9"})

    assert resolve_request_ip(request) == "5.5.5.5"


def test_direct_origin_uses_socket_ip_even_when_cf_header_exists(monkeypatch: MonkeyPatch) -> None:
    async def run() -> None:
        monkeypatch.setattr(settings, "app_env", "production")
        monkeypatch.setattr(settings, "api_public_base_url", "https://api.yuanshenjian.cn")
        monkeypatch.setattr(settings, "trust_cf_connecting_ip", True)
        request = build_request(
            host="blog-core-service.onrender.com",
            headers={"cf-connecting-ip": "1.2.3.4"},
            client_host="5.5.5.5",
        )

        subject = await RequestIdentityResolver().resolve_public_subject(request, Response())

        assert subject.direct_origin is True
        assert subject.raw_ip == "5.5.5.5"

    asyncio.run(run())


def test_legacy_cookie_reuses_existing_visitor_and_reissues_signed_cookie() -> None:
    async def run() -> None:
        request = build_request(cookies={VISITOR_COOKIE: "legacy-token"})
        response = Response()

        subject = await RequestIdentityResolver().resolve_public_subject(request, response)

        set_cookie = response.headers["set-cookie"]
        assert subject.visitor_token_status == "legacy"
        assert subject.visitor_key == "legacy-token"
        assert f"{VISITOR_COOKIE}=" in set_cookie
        assert "legacy-token" not in set_cookie

    asyncio.run(run())


def test_signed_cookie_is_valid_without_reissuing_cookie() -> None:
    async def run() -> None:
        token = issue_signed_visitor_token("visitor-1", datetime.now(UTC))
        request = build_request(cookies={VISITOR_COOKIE: token})
        response = Response()

        subject = await RequestIdentityResolver().resolve_public_subject(request, response)

        assert subject.visitor_token_status == "valid"
        assert subject.visitor_key == "visitor-1"
        assert "set-cookie" not in response.headers

    asyncio.run(run())
