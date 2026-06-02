from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.shared.infra.persistence.models import AIRequestEvent, ArticleViewDailyStats, Comment, KnowledgeChunk, KnowledgeDocument, RagSyncRun


class AdminConsoleQueryService:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_dashboard_overview(self) -> dict[str, int]:
        today = date.today()
        total_pv = self._session.scalar(select(func.coalesce(func.sum(ArticleViewDailyStats.pv_count), 0))) or 0
        today_pv = self._session.scalar(select(func.coalesce(func.sum(ArticleViewDailyStats.pv_count), 0)).where(ArticleViewDailyStats.stat_date == today)) or 0
        approved_comments = self._session.scalar(select(func.count()).select_from(Comment).where(Comment.status == "approved")) or 0
        pending_comments = self._session.scalar(select(func.count()).select_from(Comment).where(Comment.status == "pending")) or 0
        return {
            "total_pv": int(total_pv),
            "today_pv": int(today_pv),
            "approved_comments": int(approved_comments),
            "pending_comments": int(pending_comments),
        }

    def list_article_analytics(self, limit: int = 20) -> list[dict[str, int | str]]:
        rows = self._session.execute(
            select(
                ArticleViewDailyStats.article_slug,
                func.coalesce(func.sum(ArticleViewDailyStats.pv_count), 0),
                func.coalesce(func.sum(ArticleViewDailyStats.uv_count), 0),
            )
            .group_by(ArticleViewDailyStats.article_slug)
            .order_by(func.sum(ArticleViewDailyStats.pv_count).desc())
            .limit(limit)
        )
        return [{"article_slug": str(slug), "pv": int(pv), "uv": int(uv)} for slug, pv, uv in rows]

    def get_ai_usage_overview(self) -> dict[str, object]:
        total = self._session.scalar(select(func.count()).select_from(AIRequestEvent)) or 0
        return {"total_requests": int(total), "items": []}

    def get_system_status(self) -> dict[str, object]:
        documents = self._session.scalar(select(func.count()).select_from(KnowledgeDocument)) or 0
        chunks = self._session.scalar(select(func.count()).select_from(KnowledgeChunk)) or 0
        last_sync = self._session.scalar(select(RagSyncRun).order_by(RagSyncRun.started_at.desc()).limit(1))
        return {
            "api": "ok",
            "db": "ok",
            "rag_documents": int(documents),
            "rag_chunks": int(chunks),
            "last_rag_sync": None
            if last_sync is None
            else {
                "status": last_sync.status,
                "commit_sha": last_sync.commit_sha,
                "started_at": last_sync.started_at.isoformat(),
            },
        }
