from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.contexts.visitor_identity.application.dto.get_current_visitor_identity_dto import GetCurrentVisitorIdentityResp
from app.contexts.visitor_identity.application.get_current_visitor_identity_app_service import GetCurrentVisitorIdentityAppService
from app.shared.security import get_actor
from app.shared.infra.database import get_session

router = APIRouter()


def build_get_current_visitor_identity_service() -> GetCurrentVisitorIdentityAppService:
    return GetCurrentVisitorIdentityAppService()


def get_get_current_visitor_identity_service() -> GetCurrentVisitorIdentityAppService:
    return build_get_current_visitor_identity_service()


@router.get("/api/v1/me", response_model=GetCurrentVisitorIdentityResp)
def get_current_visitor_identity(
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
    service: GetCurrentVisitorIdentityAppService = Depends(get_get_current_visitor_identity_service),
) -> GetCurrentVisitorIdentityResp:
    actor = get_actor(session, request, response)
    return service.execute(actor)
