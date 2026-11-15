from __future__ import annotations

from fastapi import APIRouter, Response

router = APIRouter()

# 健康检查必须反映源站实时状态，禁止 Cloudflare / Render 等中间层缓存
HEALTH_CACHE_CONTROL = "no-store, max-age=0"


@router.get("/api/v1/healthz")
def api_healthz(response: Response) -> dict[str, str]:
    response.headers["Cache-Control"] = HEALTH_CACHE_CONTROL
    return {"status": "ok"}


@router.get("/healthz")
def healthz(response: Response) -> dict[str, str]:
    response.headers["Cache-Control"] = HEALTH_CACHE_CONTROL
    return {"status": "ok"}
