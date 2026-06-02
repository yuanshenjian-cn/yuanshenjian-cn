from __future__ import annotations

from app.shared.domain.domain_exception import ValidationDomainException


class InvalidAdminPasswordError(ValidationDomainException):
    def __init__(self) -> None:
        super().__init__(error_code="invalid_admin_password")
