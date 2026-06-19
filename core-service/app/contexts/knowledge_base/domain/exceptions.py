from __future__ import annotations

from app.shared.domain.domain_exception import NotFoundDomainException, ValidationDomainException


class KnowledgeSourceValidationError(ValidationDomainException):
    def __init__(self, error_code: str, message: str) -> None:
        super().__init__(error_code, message)


class KnowledgeSourceNotFoundError(NotFoundDomainException):
    def __init__(self, source_id: str) -> None:
        super().__init__("knowledge_source_not_found", f"知识源不存在：{source_id}")


class KnowledgeTermValidationError(ValidationDomainException):
    def __init__(self, error_code: str, message: str) -> None:
        super().__init__(error_code, message)


class KnowledgeTermNotFoundError(NotFoundDomainException):
    def __init__(self, term_id: str) -> None:
        super().__init__("knowledge_term_not_found", f"术语不存在：{term_id}")
