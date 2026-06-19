from __future__ import annotations

import logging

import httpx

from app.shared.infra.app_config import settings

logger = logging.getLogger(__name__)

CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"


class CloudflareCachePurgeService:
    """清理 Cloudflare CDN 缓存。配置缺失时静默跳过，不阻断业务流程。"""

    def __init__(self, api_token: str = "", zone_id: str = "") -> None:
        self._api_token = api_token or settings.cloudflare_api_token
        self._zone_id = zone_id or settings.cloudflare_zone_id

    def _is_configured(self) -> bool:
        return bool(self._api_token.strip() and self._zone_id.strip())

    async def purge_urls(self, urls: list[str]) -> bool:
        if not urls:
            return True
        if not self._is_configured():
            logger.info("cloudflare purge skipped: token or zone id missing")
            return False
        headers = {
            "Authorization": f"Bearer {self._api_token}",
            "Content-Type": "application/json",
        }
        payload = {"files": urls}
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.post(
                    f"{CLOUDFLARE_API_BASE}/zones/{self._zone_id}/purge_cache",
                    headers=headers,
                    json=payload,
                )
        except httpx.HTTPError as error:
            logger.error("cloudflare purge failed: %s", error)
            return False
        if not response.is_success:
            logger.error("cloudflare purge failed: status=%s body=%s", response.status_code, response.text)
            return False
        logger.info("cloudflare purge ok: %s urls", len(urls))
        return True
