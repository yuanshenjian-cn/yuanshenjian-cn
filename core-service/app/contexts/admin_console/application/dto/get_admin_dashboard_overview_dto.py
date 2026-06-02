from __future__ import annotations

from pydantic import BaseModel


class GetAdminDashboardOverviewResp(BaseModel):
    total_pv: int
    today_pv: int
    approved_comments: int
    pending_comments: int
