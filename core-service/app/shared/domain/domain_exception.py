from __future__ import annotations


class DomainException(Exception):
    def __init__(self, error_code: str, message: str | None = None) -> None:
        self.error_code = error_code
        super().__init__(message or error_code)


class NotFoundDomainException(DomainException):
    pass


class ConflictDomainException(DomainException):
    pass


class ValidationDomainException(DomainException):
    pass


class InvalidStateDomainException(DomainException):
    pass
