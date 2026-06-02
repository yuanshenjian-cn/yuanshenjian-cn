from __future__ import annotations

from pydantic import BaseModel


class GetAdminAIUsageOverviewResp(BaseModel):
    total_requests: int
    items: list[dict[str, object]]
