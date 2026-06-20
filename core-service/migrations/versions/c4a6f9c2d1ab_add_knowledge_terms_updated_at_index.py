"""add knowledge_terms updated_at index

Revision ID: c4a6f9c2d1ab
Revises: 905477abc8ab
Create Date: 2026-06-20 00:10:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "c4a6f9c2d1ab"
down_revision = "905477abc8ab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_knowledge_terms_updated_created",
        "knowledge_terms",
        ["updated_at", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_knowledge_terms_updated_created", table_name="knowledge_terms")
