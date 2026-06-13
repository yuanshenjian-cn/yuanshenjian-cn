from __future__ import annotations

from typing import cast

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse

from app.contexts.ai_assistant.application.ai_usage_recorder import (
    AIUsageAuditContext,
    AIUsageRecorder,
    wrap_stream_with_usage_finalize,
)
from app.contexts.ai_assistant.application.daily_budget_service import (
    DailyBudgetExceededError,
    DailyBudgetReservation,
    DailyBudgetService,
)
from app.contexts.ai_assistant.application.dto.stream_ai_briefing_recommendation_dto import (
    BriefingRange,
    StreamAiBriefingRecommendationReq,
)
from app.contexts.ai_assistant.application.dto.stream_ai_advisor_dto import StreamAIAdvisorReq
from app.contexts.ai_assistant.application.dto.stream_ai_assistant_chat_dto import StreamAIAssistantChatReq
from app.contexts.ai_assistant.application.dto.stream_article_chat_dto import StreamArticleChatReq
from app.contexts.ai_assistant.application.dto.stream_article_recommendation_dto import (
    StreamArticleRecommendationReq,
)
from app.contexts.ai_assistant.application.dto.stream_author_chat_dto import StreamAuthorChatReq
from app.contexts.ai_assistant.application.dto.stream_investment_briefing_recommendation_dto import (
    InvestmentBriefingRange,
    StreamInvestmentBriefingRecommendationReq,
)
from app.contexts.ai_assistant.application.stream_ai_advisor_app_service import StreamAIAdvisorAppService
from app.contexts.ai_assistant.application.stream_ai_briefing_recommendation_app_service import (
    StreamAiBriefingRecommendationAppService,
)
from app.contexts.ai_assistant.application.stream_article_chat_app_service import StreamArticleChatAppService
from app.contexts.ai_assistant.application.stream_article_recommendation_app_service import (
    StreamArticleRecommendationAppService,
)
from app.contexts.ai_assistant.application.stream_author_chat_app_service import StreamAuthorChatAppService
from app.contexts.ai_assistant.application.stream_investment_briefing_recommendation_app_service import (
    StreamInvestmentBriefingRecommendationAppService,
)
from app.contexts.ai_assistant.infra.knowledge_context_query_service import KnowledgeContextQueryService
from app.contexts.ai_assistant.infra.llm_message_stream_gateway import ProviderBackedLLMMessageStreamGateway
from app.contexts.ai_assistant.infra.llm_profile_query_service import LLMProfileQueryService
from app.contexts.ai_assistant.infra.llm_stream_service import LLMStreamService
from app.contexts.ai_assistant.infra.published_ai_asset_query_service import PublishedAIAssetQueryService
from app.contexts.ai_assistant.infra.dao.daily_budget_usage_dao import DailyBudgetUsageDAO
from app.contexts.ai_assistant.infra.sqlmodel_daily_budget_repository import SQLModelDailyBudgetRepository
from app.shared.infra.app_config import settings
from app.shared.infra.database import transactional_session
from app.shared.infra.pre_auth_rate_limit_guard import PreAuthRateLimitGuard
from app.shared.infra.rate_limit_guard import RateLimitGuard
from app.shared.infra.request_identity_resolver import RequestIdentityResolver
from app.shared.infra.request_security import turnstile_action_for_scene, verify_origin, verify_turnstile

router = APIRouter()


def build_stream_article_recommendation_service() -> StreamArticleRecommendationAppService:
    return StreamArticleRecommendationAppService(
        PublishedAIAssetQueryService(),
        LLMProfileQueryService(),
        ProviderBackedLLMMessageStreamGateway(),
    )


def get_stream_article_recommendation_service() -> StreamArticleRecommendationAppService:
    return build_stream_article_recommendation_service()


def build_stream_ai_briefing_recommendation_service() -> StreamAiBriefingRecommendationAppService:
    return StreamAiBriefingRecommendationAppService(
        PublishedAIAssetQueryService(),
        LLMProfileQueryService(),
        ProviderBackedLLMMessageStreamGateway(),
    )


def get_stream_ai_briefing_recommendation_service() -> StreamAiBriefingRecommendationAppService:
    return build_stream_ai_briefing_recommendation_service()


def build_stream_investment_briefing_recommendation_service() -> StreamInvestmentBriefingRecommendationAppService:
    return StreamInvestmentBriefingRecommendationAppService(
        PublishedAIAssetQueryService(),
        LLMProfileQueryService(),
        ProviderBackedLLMMessageStreamGateway(),
    )


def get_stream_investment_briefing_recommendation_service() -> StreamInvestmentBriefingRecommendationAppService:
    return build_stream_investment_briefing_recommendation_service()


def build_stream_article_chat_service() -> StreamArticleChatAppService:
    return StreamArticleChatAppService(PublishedAIAssetQueryService(), LLMProfileQueryService(), LLMStreamService())


def get_stream_article_chat_service() -> StreamArticleChatAppService:
    return build_stream_article_chat_service()


def build_stream_author_chat_service() -> StreamAuthorChatAppService:
    return StreamAuthorChatAppService(PublishedAIAssetQueryService(), LLMProfileQueryService(), LLMStreamService())


def get_stream_author_chat_service() -> StreamAuthorChatAppService:
    return build_stream_author_chat_service()


def build_stream_ai_advisor_service() -> StreamAIAdvisorAppService:
    return StreamAIAdvisorAppService(
        LLMProfileQueryService(),
        LLMStreamService(),
        KnowledgeContextQueryService(),
        PublishedAIAssetQueryService(),
    )


def get_stream_ai_advisor_service() -> StreamAIAdvisorAppService:
    return build_stream_ai_advisor_service()


def estimate_token_budget(message: str) -> int:
    return min(max(len(message) // 2 + 512, 512), 4_000)


async def reserve_ai_chat_budget(estimated_tokens: int) -> DailyBudgetReservation:
    async with transactional_session() as session:
        repository = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
        return await DailyBudgetService(repository).reserve_chat_request(estimated_tokens)


async def reserve_ai_advisor_budget(estimated_tokens: int) -> DailyBudgetReservation:
    async with transactional_session() as session:
        repository = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
        return await DailyBudgetService(repository).reserve_advisor_request(estimated_tokens)


def _parse_briefing_range(payload: StreamAIAssistantChatReq) -> BriefingRange:
    raw_context = payload.context if isinstance(payload.context, dict) else {}
    raw_range = raw_context.get("range")
    if isinstance(raw_range, str) and raw_range in {"today", "3d", "7d", "14d", "30d"}:
        return cast(BriefingRange, raw_range)
    raise HTTPException(status_code=400, detail="invalid_range")


def _parse_investment_briefing_range(payload: StreamAIAssistantChatReq) -> InvestmentBriefingRange:
    raw_context = payload.context if isinstance(payload.context, dict) else {}
    raw_range = raw_context.get("range")
    if isinstance(raw_range, str) and raw_range in {"3d", "7d", "14d", "30d"}:
        return cast(InvestmentBriefingRange, raw_range)
    raise HTTPException(status_code=400, detail="invalid_range")


def _parse_article_slug(payload: StreamAIAssistantChatReq) -> str:
    raw_context = payload.context if isinstance(payload.context, dict) else {}
    slug = raw_context.get("slug")
    if isinstance(slug, str) and slug.strip():
        return slug.strip()
    raise HTTPException(status_code=400, detail="invalid_article_context")


@router.post("/api/v1/ai-assistant/chat/stream")
async def stream_ai_assistant_chat(
    payload: StreamAIAssistantChatReq,
    request: Request,
    response: Response,
    article_recommendation_service: StreamArticleRecommendationAppService = Depends(get_stream_article_recommendation_service),
    ai_briefing_recommendation_service: StreamAiBriefingRecommendationAppService = Depends(get_stream_ai_briefing_recommendation_service),
    investment_briefing_recommendation_service: StreamInvestmentBriefingRecommendationAppService = Depends(get_stream_investment_briefing_recommendation_service),
    article_chat_service: StreamArticleChatAppService = Depends(get_stream_article_chat_service),
    author_chat_service: StreamAuthorChatAppService = Depends(get_stream_author_chat_service),
) -> StreamingResponse:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    subject = await RequestIdentityResolver().resolve_public_subject(request, response)
    await PreAuthRateLimitGuard().enforce("ai_chat", subject)
    verified = await verify_turnstile(
        payload.cf_turnstile_response,
        turnstile_action_for_scene(payload.scene),
        subject.raw_ip,
    )
    if not verified:
        raise HTTPException(status_code=403, detail="turnstile_failed")
    await RateLimitGuard().enforce("ai_chat", subject)
    try:
        reservation = await reserve_ai_chat_budget(estimate_token_budget(payload.message))
    except DailyBudgetExceededError as error:
        raise HTTPException(status_code=429, detail=f"ai_budget_exceeded:{error.budget_key}") from error

    if payload.scene == "article_recommendation":
        stream = (await article_recommendation_service.execute(StreamArticleRecommendationReq(message=payload.message))).stream
    elif payload.scene == "ai_briefing_recommendation":
        stream = (
            await ai_briefing_recommendation_service.execute(
                StreamAiBriefingRecommendationReq(message=payload.message, range=_parse_briefing_range(payload))
            )
        ).stream
    elif payload.scene == "investment_briefing_recommendation":
        stream = (
            await investment_briefing_recommendation_service.execute(
                StreamInvestmentBriefingRecommendationReq(
                    message=payload.message,
                    range=_parse_investment_briefing_range(payload),
                )
            )
        ).stream
    elif payload.scene == "article":
        stream = (await article_chat_service.execute(StreamArticleChatReq(message=payload.message, slug=_parse_article_slug(payload)))).stream
    elif payload.scene == "author":
        stream = (await author_chat_service.execute(StreamAuthorChatReq(message=payload.message))).stream
    else:
        raise HTTPException(status_code=400, detail="unsupported_scene")

    return StreamingResponse(
        wrap_stream_with_usage_finalize(
            stream,
            reservation,
            AIUsageAuditContext(
                scene=payload.scene,
                actor=None,
                provider=None,
                model=None,
                input_chars=len(payload.message),
            ),
            AIUsageRecorder(),
        ),
        media_type="text/event-stream",
    )


@router.post("/api/v1/ai-assistant/advisor/stream")
async def stream_ai_advisor(
    payload: StreamAIAdvisorReq,
    request: Request,
    response: Response,
    service: StreamAIAdvisorAppService = Depends(get_stream_ai_advisor_service),
) -> StreamingResponse:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    subject = await RequestIdentityResolver().resolve_public_subject(request, response)
    await PreAuthRateLimitGuard().enforce("ai_advisor", subject)
    verified = await verify_turnstile(payload.cf_turnstile_response, turnstile_action_for_scene(payload.scene), subject.raw_ip)
    if not verified:
        raise HTTPException(status_code=403, detail="turnstile_failed")
    await RateLimitGuard().enforce("ai_advisor", subject)
    try:
        reservation = await reserve_ai_advisor_budget(estimate_token_budget(payload.message))
    except DailyBudgetExceededError as error:
        raise HTTPException(status_code=429, detail=f"ai_budget_exceeded:{error.budget_key}") from error
    return StreamingResponse(
        wrap_stream_with_usage_finalize(
            service.execute(payload),
            reservation,
            AIUsageAuditContext(
                scene=payload.scene,
                actor=None,
                provider=None,
                model=None,
                input_chars=len(payload.message),
            ),
            AIUsageRecorder(),
        ),
        media_type="text/event-stream",
    )
