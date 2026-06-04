from __future__ import annotations

from datetime import date

from datetime import datetime

from sqlalchemy import Date, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base


class DailyBudgetUsagePO(Base):
    __tablename__ = "daily_budget_usage"

    usage_date: Mapped[date] = mapped_column(Date, primary_key=True)
    budget_key: Mapped[str] = mapped_column(String(64), primary_key=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    token_count: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
