from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.comment.infra.po.article_comment_po import ArticleCommentPO


class CommentDAO:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, comment_id: str) -> ArticleCommentPO | None:
        return await self._session.get(ArticleCommentPO, comment_id)

    def add(self, comment_po: ArticleCommentPO) -> None:
        self._session.add(comment_po)

    async def flush(self) -> None:
        await self._session.flush()

    async def refresh(self, comment_po: ArticleCommentPO) -> None:
        await self._session.refresh(comment_po)

    async def list_public_by_article(self, article_slug: str, limit: int) -> list[ArticleCommentPO]:
        statement = (
            select(ArticleCommentPO)
            .where(ArticleCommentPO.article_slug == article_slug, ArticleCommentPO.status == "approved")
            .order_by(ArticleCommentPO.created_at.asc())
            .limit(limit)
        )
        return list(await self._session.scalars(statement))

    async def list_by_status(self, status: str, limit: int) -> list[ArticleCommentPO]:
        statement = select(ArticleCommentPO).where(ArticleCommentPO.status == status).order_by(ArticleCommentPO.created_at.desc()).limit(limit)
        return list(await self._session.scalars(statement))
