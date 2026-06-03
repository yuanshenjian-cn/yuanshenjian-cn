from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.visitor_identity.application.dto.get_current_visitor_identity_dto import GetCurrentVisitorIdentityResp
from app.contexts.visitor_identity.application.get_current_visitor_identity_app_service import GetCurrentVisitorIdentityAppService
from app.contexts.visitor_identity.infra.dao.visitor_identity_dao import VisitorIdentityDAO
from app.contexts.visitor_identity.infra.sqlmodel_visitor_identity_repository import SQLModelVisitorIdentityRepository
from app.contexts.visitor_identity.infra.visitor_actor_resolver import VisitorActorResolver
from app.shared.infra.database import get_session

router = APIRouter()


def build_get_current_visitor_identity_service() -> GetCurrentVisitorIdentityAppService:
    return GetCurrentVisitorIdentityAppService()


def get_get_current_visitor_identity_service() -> GetCurrentVisitorIdentityAppService:
    return build_get_current_visitor_identity_service()


def build_visitor_actor_resolver(session: AsyncSession) -> VisitorActorResolver:
    return VisitorActorResolver(SQLModelVisitorIdentityRepository(VisitorIdentityDAO(session)))


def get_visitor_actor_resolver(session: AsyncSession = Depends(get_session)) -> VisitorActorResolver:
    return build_visitor_actor_resolver(session)


@router.get("/api/v1/me", response_model=GetCurrentVisitorIdentityResp)
async def get_current_visitor_identity(
    request: Request,
    response: Response,
    actor_resolver: VisitorActorResolver = Depends(get_visitor_actor_resolver),
    service: GetCurrentVisitorIdentityAppService = Depends(get_get_current_visitor_identity_service),
) -> GetCurrentVisitorIdentityResp:
    actor = await actor_resolver.resolve(request, response)
    return service.execute(actor)
