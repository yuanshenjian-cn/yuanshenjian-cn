from __future__ import annotations

from datetime import date

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.shared.infra.persistence.base import Base


class DailyBudgetUsagePO(Base):
    __tablename__ = "daily_budget_usage"

    usage_date: Mapped[date] = mapped_column(Date, primary_key=True)
    scene: Mapped[str] = mapped_column(String(64), primary_key=True)
    request_count: Mapped[int] = mapped_column(Integer, default=0)
    estimated_tokens: Mapped[int] = mapped_column(Integer, default=0)
