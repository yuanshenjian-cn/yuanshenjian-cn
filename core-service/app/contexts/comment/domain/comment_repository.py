from __future__ import annotations

from abc import ABC, abstractmethod

from app.contexts.comment.domain.comment import ArticleComment, CommentStatus


class CommentRepository(ABC):
    @abstractmethod
    async def get_by_id(self, comment_id: str) -> ArticleComment | None:
        raise NotImplementedError

    @abstractmethod
    async def add(self, comment: ArticleComment) -> ArticleComment:
        raise NotImplementedError

    @abstractmethod
    async def save(self, comment: ArticleComment) -> ArticleComment:
        raise NotImplementedError

    @abstractmethod
    async def list_public_by_article(self, article_slug: str, limit: int) -> list[ArticleComment]:
        raise NotImplementedError

    @abstractmethod
    async def list_by_status(self, status: CommentStatus, limit: int) -> list[ArticleComment]:
        raise NotImplementedError
