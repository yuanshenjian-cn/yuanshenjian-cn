from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterable, AsyncIterator
from dataclasses import dataclass
from time import perf_counter
from typing import Protocol

from app.contexts.ai_assistant.application.daily_budget_service import DailyBudgetReservation, DailyBudgetService
from app.contexts.ai_assistant.infra.dao.daily_budget_usage_dao import DailyBudgetUsageDAO
from app.contexts.ai_assistant.infra.po.ai_request_event_po import AIRequestEventPO
from app.contexts.ai_assistant.infra.sqlmodel_daily_budget_repository import SQLModelDailyBudgetRepository
from app.shared.domain.actor import Actor
from app.shared.infra.database import transactional_session


@dataclass(frozen=True)
class AIStreamUsage:
    prompt_tokens: int | None
    completion_tokens: int | None
    total_tokens: int | None


@dataclass(frozen=True)
class AIUsageAuditContext:
    scene: str
    actor: Actor | None
    provider: str | None
    model: str | None
    input_chars: int
    conversation_id: str | None = None


class AIUsageRecorderPort(Protocol):
    async def record_and_finalize(
        self,
        reservation: DailyBudgetReservation,
        audit_context: AIUsageAuditContext,
        output_chars: int,
        usage: AIStreamUsage | None,
        latency_ms: int,
        status: str,
        error_code: str | None,
    ) -> None: ...


class AIUsageRecorder:
    async def record_and_finalize(
        self,
        reservation: DailyBudgetReservation,
        audit_context: AIUsageAuditContext,
        output_chars: int,
        usage: AIStreamUsage | None,
        latency_ms: int,
        status: str,
        error_code: str | None,
    ) -> None:
        async with transactional_session() as session:
            repository = SQLModelDailyBudgetRepository(DailyBudgetUsageDAO(session))
            await DailyBudgetService(repository).finalize_token_usage(reservation, usage.total_tokens if usage else None)
            actor = audit_context.actor
            session.add(
                AIRequestEventPO(
                    scene=audit_context.scene,
                    actor_type=actor.actor_type if actor else "visitor",
                    visitor_id=actor.visitor_id if actor else None,
                    user_id=actor.user_id if actor else None,
                    conversation_id=audit_context.conversation_id,
                    provider=audit_context.provider,
                    model=audit_context.model,
                    input_chars=audit_context.input_chars,
                    output_chars=output_chars,
                    prompt_tokens=usage.prompt_tokens if usage else None,
                    completion_tokens=usage.completion_tokens if usage else None,
                    latency_ms=latency_ms,
                    status=status,
                    error_code=error_code,
                )
            )


async def wrap_stream_with_usage_finalize(
    stream: AsyncIterable[str],
    reservation: DailyBudgetReservation,
    audit_context: AIUsageAuditContext,
    usage_recorder: AIUsageRecorderPort,
    success_status: str = "success",
    provider_error_status: str = "provider_error",
    aborted_without_usage_status: str = "aborted_estimated_only",
) -> AsyncIterator[str]:
    started_at = perf_counter()
    output_chars = 0
    usage: AIStreamUsage | None = None
    status = aborted_without_usage_status
    error_code: str | None = None
    try:
        async for chunk in stream:
            output_chars += len(chunk)
            usage = _extract_usage_from_sse_chunk(chunk) or usage
            status = success_status
            yield chunk
    except Exception as error:
        status = provider_error_status
        error_code = type(error).__name__
        raise
    finally:
        latency_ms = int((perf_counter() - started_at) * 1000)
        record_task = asyncio.create_task(
            usage_recorder.record_and_finalize(
                reservation=reservation,
                audit_context=audit_context,
                output_chars=output_chars,
                usage=usage,
                latency_ms=latency_ms,
                status=status,
                error_code=error_code,
            )
        )
        record_task.add_done_callback(_consume_task_exception)
        await asyncio.shield(record_task)


def _consume_task_exception(task: asyncio.Task[None]) -> None:
    try:
        task.exception()
    except asyncio.CancelledError:
        pass


def _extract_usage_from_sse_chunk(chunk: str) -> AIStreamUsage | None:
    if "event: done" not in chunk:
        return None
    for line in chunk.splitlines():
        if not line.startswith("data: "):
            continue
        try:
            payload = json.loads(line.removeprefix("data: "))
        except json.JSONDecodeError:
            return None
        if not isinstance(payload, dict):
            return None
        usage = payload.get("usage")
        if not isinstance(usage, dict):
            return None
        return AIStreamUsage(
            prompt_tokens=_optional_int(usage.get("promptTokens") or usage.get("prompt_tokens")),
            completion_tokens=_optional_int(usage.get("completionTokens") or usage.get("completion_tokens")),
            total_tokens=_optional_int(usage.get("totalTokens") or usage.get("total_tokens")),
        )
    return None


def _optional_int(value: object) -> int | None:
    if isinstance(value, int):
        return value
    return None
