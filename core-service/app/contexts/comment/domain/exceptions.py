from __future__ import annotations


class CommentDomainError(Exception):
    pass


class InvalidParentCommentError(CommentDomainError):
    pass


class CommentNotFoundError(CommentDomainError):
    pass
