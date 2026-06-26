"""add knowledge term references

Revision ID: 6f2a9c7e1d34
Revises: 2384254920d7
Create Date: 2026-06-27 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6f2a9c7e1d34"
down_revision = "c4a6f9c2d1ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("knowledge_terms", sa.Column("references", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))


def downgrade() -> None:
    op.drop_column("knowledge_terms", "references")
