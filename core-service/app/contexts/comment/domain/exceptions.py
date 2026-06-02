from __future__ import annotations

from app.shared.domain.domain_exception import InvalidStateDomainException, NotFoundDomainException, ValidationDomainException


class CommentDomainError(ValidationDomainException):
    pass


class InvalidParentCommentError(CommentDomainError):
    def __init__(self) -> None:
        super().__init__(error_code="invalid_parent_comment")


class CommentNotFoundError(NotFoundDomainException):
    def __init__(self) -> None:
        super().__init__(error_code="comment_not_found")


class CommentInvalidStateError(InvalidStateDomainException):
    def __init__(self, error_code: str) -> None:
        super().__init__(error_code=error_code)
