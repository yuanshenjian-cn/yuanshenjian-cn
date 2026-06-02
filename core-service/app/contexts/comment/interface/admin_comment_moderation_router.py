from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.contexts.comment.application.dto.list_comment_moderation_queue_dto import ListCommentModerationQueueResp
from app.contexts.comment.application.dto.review_article_comment_dto import (
    ReviewArticleCommentPayloadReq,
    ReviewArticleCommentReq,
    ReviewArticleCommentResp,
)
from app.contexts.comment.application.list_comment_moderation_queue_app_service import ListCommentModerationQueueAppService
from app.contexts.comment.application.review_article_comment_app_service import ReviewArticleCommentAppService
from app.contexts.comment.domain.exceptions import CommentNotFoundError
from app.contexts.comment.infra.dao.comment_dao import CommentDAO
from app.contexts.comment.infra.sqlmodel_comment_repository import SQLModelCommentRepository
from app.shared.security import require_admin, require_csrf, verify_origin
from app.shared.config import settings
from app.shared.infra.database import get_session

router = APIRouter(prefix="/api/v1/admin/comments")


def build_list_comment_moderation_queue_service(session: Session) -> ListCommentModerationQueueAppService:
    return ListCommentModerationQueueAppService(SQLModelCommentRepository(CommentDAO(session)))


def get_list_comment_moderation_queue_service(session: Session = Depends(get_session)) -> ListCommentModerationQueueAppService:
    return build_list_comment_moderation_queue_service(session)


def build_review_article_comment_service(session: Session) -> ReviewArticleCommentAppService:
    return ReviewArticleCommentAppService(SQLModelCommentRepository(CommentDAO(session)))


def get_review_article_comment_service(session: Session = Depends(get_session)) -> ReviewArticleCommentAppService:
    return build_review_article_comment_service(session)


@router.get("", response_model=ListCommentModerationQueueResp)
def list_comment_moderation_queue(
    request: Request,
    status: str = "pending",
    limit: int = 50,
    session: Session = Depends(get_session),
    service: ListCommentModerationQueueAppService = Depends(get_list_comment_moderation_queue_service),
) -> ListCommentModerationQueueResp:
    require_admin(session, request)
    return service.execute(status, limit)


def _review(
    request: Request,
    session: Session,
    comment_id: str,
    payload: ReviewArticleCommentPayloadReq,
    review_method: str,
    service: ReviewArticleCommentAppService,
) -> ReviewArticleCommentResp:
    require_admin(session, request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    require_csrf(request)
    req = ReviewArticleCommentReq(comment_id=comment_id, review_note=payload.review_note, csrf_token=payload.csrf_token)
    try:
        if review_method == "approve":
            return service.approve(req, reviewed_by="admin")
        if review_method == "reject":
            return service.reject(req, reviewed_by="admin")
        return service.mark_spam(req, reviewed_by="admin")
    except CommentNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error


@router.post("/{comment_id}/approve", response_model=ReviewArticleCommentResp)
def approve_article_comment(
    comment_id: str,
    payload: ReviewArticleCommentPayloadReq,
    request: Request,
    session: Session = Depends(get_session),
    service: ReviewArticleCommentAppService = Depends(get_review_article_comment_service),
) -> ReviewArticleCommentResp:
    return _review(request, session, comment_id, payload, "approve", service)


@router.post("/{comment_id}/reject", response_model=ReviewArticleCommentResp)
def reject_article_comment(
    comment_id: str,
    payload: ReviewArticleCommentPayloadReq,
    request: Request,
    session: Session = Depends(get_session),
    service: ReviewArticleCommentAppService = Depends(get_review_article_comment_service),
) -> ReviewArticleCommentResp:
    return _review(request, session, comment_id, payload, "reject", service)


@router.post("/{comment_id}/mark-spam", response_model=ReviewArticleCommentResp)
def mark_spam_article_comment(
    comment_id: str,
    payload: ReviewArticleCommentPayloadReq,
    request: Request,
    session: Session = Depends(get_session),
    service: ReviewArticleCommentAppService = Depends(get_review_article_comment_service),
) -> ReviewArticleCommentResp:
    return _review(request, session, comment_id, payload, "mark-spam", service)
