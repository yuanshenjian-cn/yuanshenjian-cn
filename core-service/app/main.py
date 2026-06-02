from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.contexts.admin_console.interface.admin_auth_router import router as admin_auth_router
from app.contexts.admin_console.interface.admin_console_router import router as admin_console_router
from app.contexts.article_analytics.interface.article_view_router import router as article_view_router
from app.contexts.ai_assistant.interface.ai_assistant_chat_router import router as ai_assistant_chat_router
from app.contexts.comment.interface.admin_comment_moderation_router import router as admin_comment_moderation_router
from app.contexts.comment.interface.article_comment_router import router as article_comment_router
from app.contexts.visitor_identity.interface.visitor_identity_router import router as visitor_identity_router
from app.shared.interface.health_router import router as health_router
from app.shared.config import settings
from app.shared.infra.persistence.models import Base
from app.shared.infra.database import engine

if settings.database_url.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blog Core Service")

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
app.include_router(ai_assistant_chat_router)
