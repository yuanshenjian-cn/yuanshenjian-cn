from __future__ import annotations

from typing import NoReturn

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.contexts.admin_console.infra.admin_session_request_guard import AdminSessionRequestGuard
from app.contexts.admin_console.interface.admin_auth_router import get_admin_session_request_guard
from app.contexts.knowledge_base.application.archive_knowledge_source_app_service import ArchiveKnowledgeSourceAppService
from app.contexts.knowledge_base.application.create_knowledge_source_app_service import CreateKnowledgeSourceAppService
from app.contexts.knowledge_base.application.dto.list_knowledge_sources_dto import ListKnowledgeSourcesResp
from app.contexts.knowledge_base.application.dto.save_knowledge_source_dto import SaveKnowledgeSourceReq, SaveKnowledgeSourceResp
from app.contexts.knowledge_base.application.list_knowledge_sources_app_service import ListKnowledgeSourcesAppService
from app.contexts.knowledge_base.application.rebuild_knowledge_index_app_service import RebuildKnowledgeIndexAppService
from app.contexts.knowledge_base.application.update_knowledge_source_app_service import UpdateKnowledgeSourceAppService
from app.contexts.knowledge_base.domain.exceptions import KnowledgeSourceNotFoundError, KnowledgeSourceValidationError
from app.contexts.knowledge_base.infra.dao.knowledge_index_run_dao import KnowledgeIndexRunDAO
from app.contexts.knowledge_base.infra.dao.knowledge_source_dao import KnowledgeSourceDAO
from app.contexts.knowledge_base.infra.knowledge_source_query_service import KnowledgeSourceQueryService
from app.contexts.knowledge_base.infra.published_content_sync_service import PublishedContentSyncService
from app.shared.infra.app_config import settings
from app.shared.infra.database import get_session
from app.shared.infra.request_security import verify_origin

router = APIRouter(prefix="/api/v1/admin/knowledge-base")


def build_list_knowledge_sources_service(session: AsyncSession) -> ListKnowledgeSourcesAppService:
    return ListKnowledgeSourcesAppService(KnowledgeSourceQueryService(session))


def get_list_knowledge_sources_service(session: AsyncSession = Depends(get_session)) -> ListKnowledgeSourcesAppService:
    return build_list_knowledge_sources_service(session)


def build_create_knowledge_source_service(session: AsyncSession) -> CreateKnowledgeSourceAppService:
    return CreateKnowledgeSourceAppService(KnowledgeSourceDAO(session))


def get_create_knowledge_source_service(session: AsyncSession = Depends(get_session)) -> CreateKnowledgeSourceAppService:
    return build_create_knowledge_source_service(session)


def build_update_knowledge_source_service(session: AsyncSession) -> UpdateKnowledgeSourceAppService:
    return UpdateKnowledgeSourceAppService(KnowledgeSourceDAO(session))


def get_update_knowledge_source_service(session: AsyncSession = Depends(get_session)) -> UpdateKnowledgeSourceAppService:
    return build_update_knowledge_source_service(session)


def build_archive_knowledge_source_service(session: AsyncSession) -> ArchiveKnowledgeSourceAppService:
    return ArchiveKnowledgeSourceAppService(KnowledgeSourceDAO(session))


def get_archive_knowledge_source_service(session: AsyncSession = Depends(get_session)) -> ArchiveKnowledgeSourceAppService:
    return build_archive_knowledge_source_service(session)


def build_rebuild_knowledge_index_service(session: AsyncSession) -> RebuildKnowledgeIndexAppService:
    return RebuildKnowledgeIndexAppService(KnowledgeSourceDAO(session), KnowledgeIndexRunDAO(session), PublishedContentSyncService())


def get_rebuild_knowledge_index_service(session: AsyncSession = Depends(get_session)) -> RebuildKnowledgeIndexAppService:
    return build_rebuild_knowledge_index_service(session)


def _raise_http(error: Exception) -> NoReturn:
    if isinstance(error, KnowledgeSourceValidationError):
        raise HTTPException(status_code=400, detail=error.error_code) from error
    if isinstance(error, KnowledgeSourceNotFoundError):
        raise HTTPException(status_code=404, detail=error.error_code) from error
    raise error


@router.get("", response_model=ListKnowledgeSourcesResp)
async def list_knowledge_sources(
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: ListKnowledgeSourcesAppService = Depends(get_list_knowledge_sources_service),
) -> ListKnowledgeSourcesResp:
    await guard.require_admin(request)
    return await service.execute()


@router.post("", response_model=SaveKnowledgeSourceResp)
async def create_knowledge_source(
    payload: SaveKnowledgeSourceReq,
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: CreateKnowledgeSourceAppService = Depends(get_create_knowledge_source_service),
) -> SaveKnowledgeSourceResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        return await service.execute(payload)
    except Exception as error:
        _raise_http(error)


@router.put("/{source_id}", response_model=SaveKnowledgeSourceResp)
async def update_knowledge_source(
    source_id: str,
    payload: SaveKnowledgeSourceReq,
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: UpdateKnowledgeSourceAppService = Depends(get_update_knowledge_source_service),
) -> SaveKnowledgeSourceResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        return await service.execute(source_id, payload)
    except Exception as error:
        _raise_http(error)


@router.post("/{source_id}/archive", response_model=SaveKnowledgeSourceResp)
async def archive_knowledge_source(
    source_id: str,
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: ArchiveKnowledgeSourceAppService = Depends(get_archive_knowledge_source_service),
) -> SaveKnowledgeSourceResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        return await service.execute(source_id)
    except Exception as error:
        _raise_http(error)


@router.post("/{source_id}/rebuild", response_model=SaveKnowledgeSourceResp)
async def rebuild_knowledge_index(
    source_id: str,
    request: Request,
    guard: AdminSessionRequestGuard = Depends(get_admin_session_request_guard),
    service: RebuildKnowledgeIndexAppService = Depends(get_rebuild_knowledge_index_service),
) -> SaveKnowledgeSourceResp:
    await guard.require_admin(request)
    verify_origin(request.headers.get("origin"), settings.allowed_origins)
    guard.require_csrf(request)
    try:
        return await service.execute(source_id, settings.repo_root)
    except Exception as error:
        _raise_http(error)
