from __future__ import annotations

from typing import NoReturn

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.infra.admin_request_guard import AdminRequestGuard, get_admin_request_guard
from app.contexts.knowledge_base.application.archive_knowledge_term_app_service import ArchiveKnowledgeTermAppService
from app.contexts.knowledge_base.application.create_knowledge_term_app_service import CreateKnowledgeTermAppService
from app.contexts.knowledge_base.application.dto.list_knowledge_terms_dto import ListKnowledgeTermsReq, ListKnowledgeTermsResp
from app.contexts.knowledge_base.application.dto.save_knowledge_term_dto import SaveKnowledgeTermReq, SaveKnowledgeTermResp
from app.contexts.knowledge_base.application.list_knowledge_terms_app_service import ListKnowledgeTermsAppService
from app.contexts.knowledge_base.application.update_knowledge_term_app_service import UpdateKnowledgeTermAppService
from app.contexts.knowledge_base.domain.exceptions import KnowledgeTermNotFoundError, KnowledgeTermValidationError
from app.contexts.knowledge_base.infra.dao.knowledge_term_dao import KnowledgeTermDAO
from app.contexts.knowledge_base.infra.knowledge_term_query_service import KnowledgeTermQueryService
from app.contexts.knowledge_base.infra.knowledge_term_sync_service import KnowledgeTermSyncService
from app.shared.infra.app_config import settings
from app.shared.infra.database import get_session
from app.shared.infra.request_security import verify_origin

router = APIRouter(prefix="/api/v1/admin/knowledge-terms")


def build_list_knowledge_terms_service(session: AsyncSession) -> ListKnowledgeTermsAppService:
    return ListKnowledgeTermsAppService(KnowledgeTermQueryService(session))


def get_list_knowledge_terms_service(session: AsyncSession = Depends(get_session)) -> ListKnowledgeTermsAppService:
    return build_list_knowledge_terms_service(session)


def build_create_knowledge_term_service(session: AsyncSession) -> CreateKnowledgeTermAppService:
    return CreateKnowledgeTermAppService(KnowledgeTermDAO(session))


def get_create_knowledge_term_service(session: AsyncSession = Depends(get_session)) -> CreateKnowledgeTermAppService:
    return build_create_knowledge_term_service(session)


def build_update_knowledge_term_service(session: AsyncSession) -> UpdateKnowledgeTermAppService:
    return UpdateKnowledgeTermAppService(KnowledgeTermDAO(session))


def get_update_knowledge_term_service(session: AsyncSession = Depends(get_session)) -> UpdateKnowledgeTermAppService:
    return build_update_knowledge_term_service(session)


def build_archive_knowledge_term_service(session: AsyncSession) -> ArchiveKnowledgeTermAppService:
    return ArchiveKnowledgeTermAppService(KnowledgeTermDAO(session))


def get_archive_knowledge_term_service(session: AsyncSession = Depends(get_session)) -> ArchiveKnowledgeTermAppService:
    return build_archive_knowledge_term_service(session)


def _raise_http(error: Exception) -> NoReturn:
    if isinstance(error, KnowledgeTermValidationError):
        raise HTTPException(status_code=400, detail=error.error_code) from error
    if isinstance(error, KnowledgeTermNotFoundError):
        raise HTTPException(status_code=404, detail=error.error_code) from error
    raise error


@router.get("", response_model=ListKnowledgeTermsResp)
async def list_knowledge_terms(
    request: Request,
    page: int = 1,
    page_size: int = 10,
    guard: AdminRequestGuard = Depends(get_admin_request_guard),
    service: ListKnowledgeTermsAppService = Depends(get_list_knowledge_terms_service),
) -> ListKnowledgeTermsResp:
    await guard.require_admin(request)
    return await service.execute(ListKnowledgeTermsReq(page=page, page_size=page_size))


@router.post("", response_model=SaveKnowledgeTermResp)
async def create_knowledge_term(
    payload: SaveKnowledgeTermReq,
    request: Request,
    guard: AdminRequestGuard = Depends(get_admin_request_guard),
    service: CreateKnowledgeTermAppService = Depends(get_create_knowledge_term_service),
    session: AsyncSession = Depends(get_session),
) -> SaveKnowledgeTermResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        result = await service.execute(payload)
        term = await KnowledgeTermDAO(session).get_by_id(result.id)
        if term is not None:
            await KnowledgeTermSyncService(session).sync_term(term)
        return result
    except Exception as error:
        _raise_http(error)


@router.put("/{term_id}", response_model=SaveKnowledgeTermResp)
async def update_knowledge_term(
    term_id: str,
    payload: SaveKnowledgeTermReq,
    request: Request,
    guard: AdminRequestGuard = Depends(get_admin_request_guard),
    service: UpdateKnowledgeTermAppService = Depends(get_update_knowledge_term_service),
    session: AsyncSession = Depends(get_session),
) -> SaveKnowledgeTermResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        result = await service.execute(term_id, payload)
        term = await KnowledgeTermDAO(session).get_by_id(result.id)
        if term is not None:
            await KnowledgeTermSyncService(session).sync_term(term)
        return result
    except Exception as error:
        _raise_http(error)


@router.post("/{term_id}/archive", response_model=SaveKnowledgeTermResp)
async def archive_knowledge_term(
    term_id: str,
    request: Request,
    guard: AdminRequestGuard = Depends(get_admin_request_guard),
    service: ArchiveKnowledgeTermAppService = Depends(get_archive_knowledge_term_service),
    session: AsyncSession = Depends(get_session),
) -> SaveKnowledgeTermResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        result = await service.execute(term_id)
        term = await KnowledgeTermDAO(session).get_by_id(result.id)
        if term is not None:
            await KnowledgeTermSyncService(session).sync_term(term)
        return result
    except Exception as error:
        _raise_http(error)


@router.post("/rebuild", response_model=SaveKnowledgeTermResp)
async def rebuild_knowledge_terms(
    request: Request,
    guard: AdminRequestGuard = Depends(get_admin_request_guard),
    session: AsyncSession = Depends(get_session),
) -> SaveKnowledgeTermResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    count = await KnowledgeTermSyncService(session).sync_all_terms()
    return SaveKnowledgeTermResp(id="", status=f"synced:{count}")
