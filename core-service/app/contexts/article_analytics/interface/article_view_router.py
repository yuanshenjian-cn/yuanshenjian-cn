from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.article_analytics.application.dto.get_article_stats_dto import GetArticleStatsResp
from app.contexts.article_analytics.application.dto.record_article_view_dto import RecordArticleViewReq, RecordArticleViewResp, SubmitArticleViewReq
from app.contexts.article_analytics.application.get_article_stats_app_service import GetArticleStatsAppService
from app.contexts.article_analytics.application.record_article_view_app_service import RecordArticleViewAppService
from app.contexts.article_analytics.infra.dao.article_daily_stats_dao import ArticleDailyStatsDAO
from app.contexts.article_analytics.infra.dao.article_view_event_dao import ArticleViewEventDAO
from app.contexts.article_analytics.infra.sqlmodel_article_analytics_repository import SQLModelArticleAnalyticsRepository
from app.contexts.visitor_identity.infra.dao.visitor_identity_dao import VisitorIdentityDAO
from app.contexts.visitor_identity.infra.sqlmodel_visitor_identity_repository import SQLModelVisitorIdentityRepository
from app.contexts.visitor_identity.infra.visitor_actor_resolver import VisitorActorResolver
from app.shared.infra.app_config import settings
from app.shared.infra.database import get_session
from app.shared.infra.request_security import hash_request_ip, hash_user_agent, normalize_referrer_origin, verify_origin

router = APIRouter()


def build_record_article_view_service(session: AsyncSession) -> RecordArticleViewAppService:
    repository = SQLModelArticleAnalyticsRepository(ArticleViewEventDAO(session), ArticleDailyStatsDAO(session))
    return RecordArticleViewAppService(repository)


def get_record_article_view_service(session: AsyncSession = Depends(get_session)) -> RecordArticleViewAppService:
    return build_record_article_view_service(session)


def build_get_article_stats_service(session: AsyncSession) -> GetArticleStatsAppService:
    repository = SQLModelArticleAnalyticsRepository(ArticleViewEventDAO(session), ArticleDailyStatsDAO(session))
    return GetArticleStatsAppService(repository)


def get_get_article_stats_service(session: AsyncSession = Depends(get_session)) -> GetArticleStatsAppService:
    return build_get_article_stats_service(session)


def build_visitor_actor_resolver(session: AsyncSession) -> VisitorActorResolver:
    return VisitorActorResolver(SQLModelVisitorIdentityRepository(VisitorIdentityDAO(session)))


def get_visitor_actor_resolver(session: AsyncSession = Depends(get_session)) -> VisitorActorResolver:
    return build_visitor_actor_resolver(session)


@router.post("/api/v1/articles/{article_slug}/view", response_model=RecordArticleViewResp)
async def record_article_view(
    article_slug: str,
    payload: SubmitArticleViewReq,
    request: Request,
    response: Response,
    actor_resolver: VisitorActorResolver = Depends(get_visitor_actor_resolver),
    service: RecordArticleViewAppService = Depends(get_record_article_view_service),
) -> RecordArticleViewResp:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    actor = await actor_resolver.resolve(request, response)
    return await service.execute(
        RecordArticleViewReq(
            article_slug=article_slug,
            actor=actor,
            ip_hash=hash_request_ip(request),
            user_agent_hash=hash_user_agent(request),
            referrer_origin=normalize_referrer_origin(payload.referrer),
        )
    )


@router.get("/api/v1/articles/{article_slug}/stats", response_model=GetArticleStatsResp)
async def get_article_stats(
    article_slug: str,
    service: GetArticleStatsAppService = Depends(get_get_article_stats_service),
) -> GetArticleStatsResp:
    return await service.execute(article_slug)
