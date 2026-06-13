from __future__ import annotations

from collections.abc import Awaitable, Callable
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.responses import Response as StarletteResponse

from app.contexts.admin_console.interface.admin_auth_router import router as admin_auth_router
from app.contexts.admin_console.interface.admin_console_router import router as admin_console_router
from app.contexts.article_analytics.interface.article_view_router import router as article_view_router
from app.contexts.ai_assistant.interface.ai_assistant_chat_router import router as ai_assistant_chat_router
from app.contexts.comment.interface.admin_comment_moderation_router import router as admin_comment_moderation_router
from app.contexts.comment.interface.article_comment_router import router as article_comment_router
from app.contexts.knowledge_base.interface.admin_knowledge_base_router import router as admin_knowledge_base_router
from app.contexts.visitor_identity.interface.visitor_identity_router import router as visitor_identity_router
from app.shared.interface.health_router import router as health_router
from app.shared.infra.app_config import settings
from app.shared.infra.persistence.base import Base
import app.shared.infra.persistence.model_registry as _persistence_model_registry  # noqa: F401
from app.shared.infra.database import engine
from app.shared.infra.request_identity_resolver import trusted_custom_hosts


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    if settings.database_url.startswith("sqlite"):
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="Blog Core Service", lifespan=lifespan)


@app.middleware("http")
async def reject_untrusted_production_host(
    request: Request,
    call_next: Callable[[Request], Awaitable[StarletteResponse]],
) -> StarletteResponse:
    host = request.url.hostname or request.headers.get("host", "").split(":", 1)[0]
    if (
        settings.app_env == "production"
        and not settings.allow_direct_render_subdomain
        and host not in trusted_custom_hosts()
    ):
        return JSONResponse(status_code=404, content={"detail": "not_found"})
    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)

app.include_router(health_router)
app.include_router(visitor_identity_router)
app.include_router(article_view_router)
app.include_router(article_comment_router)
app.include_router(admin_auth_router)
app.include_router(admin_comment_moderation_router)
app.include_router(admin_console_router)
app.include_router(admin_knowledge_base_router)
app.include_router(ai_assistant_chat_router)
