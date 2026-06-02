from __future__ import annotations

from fastapi import APIRouter

router = APIRouter()


@router.get("/api/v1/healthz")
def api_healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
