from __future__ import annotations

import logging

from app.shared.infra.cloudflare_cache_purge_service import CloudflareCachePurgeService
from app.shared.infra.app_config import settings

logger = logging.getLogger(__name__)

GLOSSARY_DOMAINS = ["", "article", "ai", "health", "investment"]
GLOSSARY_SCENES = [
    "",
    "article",
    "author",
    "ai",
    "ai-column",
    "health",
    "health-column",
    "investment",
    "investment-column",
]


class GlossaryCachePurgeService:
    """术语变更后清理站点 glossary 接口的 CDN 缓存。"""

    def __init__(self, purge_service: CloudflareCachePurgeService | None = None) -> None:
        self._purge_service = purge_service or CloudflareCachePurgeService()

    def _build_urls(self) -> list[str]:
        base = settings.api_public_base_url.rstrip("/")
        path = "/api/v1/ai-assistant/glossary"
        urls: list[str] = []
        for scene in GLOSSARY_SCENES:
            for domain in GLOSSARY_DOMAINS:
                params: list[str] = []
                if scene:
                    params.append(f"scene={scene}")
                if domain:
                    params.append(f"domain={domain}")
                query = ("?" + "&".join(params)) if params else ""
                urls.append(f"{base}{path}{query}")
        return urls

    async def purge(self) -> None:
        await self._purge_service.purge_urls(self._build_urls())
