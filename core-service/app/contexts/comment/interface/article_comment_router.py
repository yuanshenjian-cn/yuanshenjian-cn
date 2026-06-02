from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.contexts.comment.application.create_article_comment_app_service import CreateArticleCommentAppService
from app.contexts.comment.application.dto.create_article_comment_dto import (
    CreateArticleCommentReq,
    CreateArticleCommentResp,
    SubmitArticleCommentReq,
)
from app.contexts.comment.application.dto.list_article_comments_dto import ListArticleCommentsResp
from app.contexts.comment.application.list_article_comments_app_service import ListArticleCommentsAppService
from app.contexts.comment.domain.exceptions import InvalidParentCommentError
from app.contexts.comment.infra.comment_markdown_renderer import CommentMarkdownRenderer
from app.contexts.comment.infra.dao.comment_dao import CommentDAO
from app.contexts.comment.infra.simple_comment_moderation_service import SimpleCommentModerationService
from app.contexts.comment.infra.sqlmodel_comment_repository import SQLModelCommentRepository
from app.shared.config import settings
from app.shared.rate_limit import comment_limiter
from app.shared.security import get_actor, hash_request_ip, hash_user_agent, verify_origin, verify_turnstile
from app.shared.infra.database import get_session

router = APIRouter()


def build_create_article_comment_service(session: Session) -> CreateArticleCommentAppService:
    repository = SQLModelCommentRepository(CommentDAO(session))
    return CreateArticleCommentAppService(repository, CommentMarkdownRenderer(), SimpleCommentModerationService())


def get_create_article_comment_service(session: Session = Depends(get_session)) -> CreateArticleCommentAppService:
    return build_create_article_comment_service(session)


def build_list_article_comments_service(session: Session) -> ListArticleCommentsAppService:
    repository = SQLModelCommentRepository(CommentDAO(session))
    return ListArticleCommentsAppService(repository)


def get_list_article_comments_service(session: Session = Depends(get_session)) -> ListArticleCommentsAppService:
    return build_list_article_comments_service(session)


@router.get("/api/v1/articles/{article_slug}/comments", response_model=ListArticleCommentsResp)
def list_article_comments(
    article_slug: str,
    limit: int = 50,
    service: ListArticleCommentsAppService = Depends(get_list_article_comments_service),
) -> ListArticleCommentsResp:
    return service.execute(article_slug, limit)


@router.post("/api/v1/articles/{article_slug}/comments", response_model=CreateArticleCommentResp)
async def create_article_comment(
    article_slug: str,
    payload: SubmitArticleCommentReq,
    request: Request,
    response: Response,
    session: Session = Depends(get_session),
    service: CreateArticleCommentAppService = Depends(get_create_article_comment_service),
) -> CreateArticleCommentResp:
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    actor = get_actor(session, request, response)
    if not comment_limiter.hit(actor.visitor_id or hash_request_ip(request)):
        raise HTTPException(status_code=429, detail="comment_rate_limited")
    verified = await verify_turnstile(payload.turnstile_token, "comment_submit", request.client.host if request.client else None)
    if not verified:
        raise HTTPException(status_code=403, detail="turnstile_failed")
    try:
        return service.execute(
            CreateArticleCommentReq(
                article_slug=article_slug,
                actor=actor,
                display_name=payload.display_name,
                email=payload.email,
                content_markdown=payload.content_markdown,
                parent_id=payload.parent_id,
                ip_hash=hash_request_ip(request),
                user_agent_hash=hash_user_agent(request),
            )
        )
    except InvalidParentCommentError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
