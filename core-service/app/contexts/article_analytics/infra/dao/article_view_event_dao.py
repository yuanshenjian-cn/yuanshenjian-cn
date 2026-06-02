from __future__ import annotations

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.contexts.article_analytics.infra.po.article_view_event_po import ArticleViewEventPO


class ArticleViewEventDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def has_viewed_on_date(self, article_slug: str, visitor_id: str | None, stat_date: date) -> bool:
        existing = self._session.scalar(
            select(ArticleViewEventPO).where(
                ArticleViewEventPO.article_slug == article_slug,
                ArticleViewEventPO.visitor_id == visitor_id,
                func.date(ArticleViewEventPO.viewed_at) == stat_date,
            )
        )
        return existing is not None

    def add(
        self,
        article_slug: str,
        visitor_id: str | None,
        user_id: str | None,
        ip_hash: str | None,
        user_agent_hash: str | None,
        referrer_origin: str | None,
    ) -> None:
        self._session.add(
            ArticleViewEventPO(
                article_slug=article_slug,
                visitor_id=visitor_id,
                user_id=user_id,
                ip_hash=ip_hash,
                user_agent_hash=user_agent_hash,
                referrer_origin=referrer_origin,
            )
        )
