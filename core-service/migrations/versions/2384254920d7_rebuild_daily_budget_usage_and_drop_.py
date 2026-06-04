"""rebuild daily budget usage and drop rate limit buckets

Revision ID: 2384254920d7
Revises: 0001_initial
Create Date: 2026-06-04 19:01:29.011481
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '2384254920d7'
down_revision = '0001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("rate_limit_buckets")
    op.drop_table("daily_budget_usage")
    op.create_table(
        "daily_budget_usage",
        sa.Column("usage_date", sa.Date(), primary_key=True),
        sa.Column("budget_key", sa.String(64), primary_key=True),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("token_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("daily_budget_usage")
    op.create_table(
        "daily_budget_usage",
        sa.Column("usage_date", sa.Date(), primary_key=True),
        sa.Column("scene", sa.String(64), primary_key=True),
        sa.Column("request_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("estimated_tokens", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "rate_limit_buckets",
        sa.Column("bucket_key", sa.String(256), primary_key=True),
        sa.Column("count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reset_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
