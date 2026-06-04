from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.ai_assistant.infra.po.ai_request_event_po import AIRequestEventPO
from app.contexts.article_analytics.infra.po.article_view_daily_stats_po import ArticleViewDailyStatsPO
from app.contexts.comment.infra.po.article_comment_po import ArticleCommentPO
from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO
from app.contexts.knowledge_base.infra.po.rag_sync_run_po import RagSyncRunPO


class AdminConsoleQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_dashboard_overview(self) -> dict[str, int]:
        today = date.today()
        total_pv = await self._session.scalar(select(func.coalesce(func.sum(ArticleViewDailyStatsPO.pv_count), 0))) or 0
        today_pv = await self._session.scalar(select(func.coalesce(func.sum(ArticleViewDailyStatsPO.pv_count), 0)).where(ArticleViewDailyStatsPO.stat_date == today)) or 0
        approved_comments = await self._session.scalar(select(func.count()).select_from(ArticleCommentPO).where(ArticleCommentPO.status == "approved")) or 0
        pending_comments = await self._session.scalar(select(func.count()).select_from(ArticleCommentPO).where(ArticleCommentPO.status == "pending")) or 0
        return {
            "total_pv": int(total_pv),
            "today_pv": int(today_pv),
            "approved_comments": int(approved_comments),
            "pending_comments": int(pending_comments),
        }

    async def list_article_analytics(self, limit: int = 20) -> list[dict[str, int | str]]:
        rows = await self._session.execute(
            select(
                ArticleViewDailyStatsPO.article_slug,
                func.coalesce(func.sum(ArticleViewDailyStatsPO.pv_count), 0),
                func.coalesce(func.sum(ArticleViewDailyStatsPO.uv_count), 0),
            )
            .group_by(ArticleViewDailyStatsPO.article_slug)
            .order_by(func.sum(ArticleViewDailyStatsPO.pv_count).desc())
            .limit(limit)
        )
        return [{"article_slug": str(slug), "pv": int(pv), "uv": int(uv)} for slug, pv, uv in rows]

    async def get_ai_usage_overview(self) -> dict[str, object]:
        total = await self._session.scalar(select(func.count()).select_from(AIRequestEventPO)) or 0
        rows = await self._session.execute(
            select(
                AIRequestEventPO.scene,
                AIRequestEventPO.status,
                func.count(),
                func.coalesce(func.sum(AIRequestEventPO.prompt_tokens), 0),
                func.coalesce(func.sum(AIRequestEventPO.completion_tokens), 0),
            ).group_by(AIRequestEventPO.scene, AIRequestEventPO.status)
        )
        return {
            "total_requests": int(total),
            "items": [
                {
                    "scene": str(scene),
                    "status": str(status),
                    "requests": int(requests),
                    "prompt_tokens": int(prompt_tokens),
                    "completion_tokens": int(completion_tokens),
                }
                for scene, status, requests, prompt_tokens, completion_tokens in rows
            ],
        }

    async def get_system_status(self) -> dict[str, object]:
        documents = await self._session.scalar(select(func.count()).select_from(KnowledgeDocumentPO)) or 0
        chunks = await self._session.scalar(select(func.count()).select_from(KnowledgeChunkPO)) or 0
        last_sync = await self._session.scalar(select(RagSyncRunPO).order_by(RagSyncRunPO.started_at.desc()).limit(1))
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
