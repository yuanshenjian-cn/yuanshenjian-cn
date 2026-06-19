"""add knowledge_terms table

Revision ID: 905477abc8ab
Revises: 9ad634c7ec9e
Create Date: 2026-06-19 16:38:34.419489
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '905477abc8ab'
down_revision = '9ad634c7ec9e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'knowledge_terms',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('term', sa.String(length=256), nullable=False),
        sa.Column('aliases', sa.JSON(), nullable=False),
        sa.Column('definition', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('related_article_slugs', sa.JSON(), nullable=False),
        sa.Column('domains', sa.JSON(), nullable=False),
        sa.Column('scenes', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('updated_by', sa.String(length=128), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_knowledge_terms_term'), 'knowledge_terms', ['term'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_knowledge_terms_term'), table_name='knowledge_terms')
    op.drop_table('knowledge_terms')
