from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.infra.persistence.models import Comment


class CommentDAO:
    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, comment_id: str) -> Comment | None:
        return self._session.get(Comment, comment_id)

    def add(self, comment_po: Comment) -> None:
        self._session.add(comment_po)

    def flush(self) -> None:
        self._session.flush()

    def refresh(self, comment_po: Comment) -> None:
        self._session.refresh(comment_po)

    def list_public_by_article(self, article_slug: str, limit: int) -> list[Comment]:
        statement = (
            select(Comment)
            .where(Comment.article_slug == article_slug, Comment.status == "approved")
            .order_by(Comment.created_at.asc())
            .limit(limit)
        )
        return list(self._session.scalars(statement))

    def list_by_status(self, status: str, limit: int) -> list[Comment]:
        statement = select(Comment).where(Comment.status == status).order_by(Comment.created_at.desc()).limit(limit)
        return list(self._session.scalars(statement))
