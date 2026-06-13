"""contextual ai advisor knowledge base

Revision ID: 9ad634c7ec9e
Revises: 2384254920d7
Create Date: 2026-06-13 14:49:22.697422
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = '9ad634c7ec9e'
down_revision = '2384254920d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    table_names = set(inspector.get_table_names())

    if "knowledge_sources" not in table_names:
        op.create_table(
            "knowledge_sources",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("name", sa.String(length=256), nullable=False),
            sa.Column("source_kind", sa.String(length=64), nullable=False),
            sa.Column("domains", sa.JSON(), nullable=False),
            sa.Column("scenes", sa.JSON(), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column("source_uri", sa.Text(), nullable=True),
            sa.Column("sync_strategy", sa.String(length=64), nullable=False),
            sa.Column("content_config", sa.JSON(), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("updated_by", sa.String(length=128), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    if "knowledge_index_runs" not in table_names:
        op.create_table(
            "knowledge_index_runs",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column("trigger", sa.String(length=64), nullable=False, server_default="manual"),
            sa.Column("source_id", sa.String(length=36), nullable=True),
            sa.Column("commit_sha", sa.String(length=64), nullable=True),
            sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("documents_seen", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("documents_upserted", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("chunks_upserted", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("chunks_deleted", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("embeddings_generated", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("error_message", sa.Text(), nullable=True),
            sa.Column("metadata", sa.JSON(), nullable=False, server_default="{}"),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        if "rag_sync_runs" in table_names:
            op.execute(
                """
                INSERT INTO knowledge_index_runs (
                    id, status, trigger, source_id, commit_sha, started_at, finished_at,
                    documents_seen, documents_upserted, chunks_upserted, chunks_deleted,
                    embeddings_generated, error_message, metadata, created_at
                )
                SELECT
                    id, status, 'published_content_sync', NULL, commit_sha, started_at, finished_at,
                    documents_seen, documents_upserted, chunks_upserted, chunks_deleted,
                    embeddings_generated, error_message, '{}', created_at
                FROM rag_sync_runs
                """
            )

    document_columns = {column["name"] for column in inspector.get_columns("knowledge_documents")}
    with op.batch_alter_table("knowledge_documents") as batch_op:
        if "knowledge_source_id" not in document_columns:
            batch_op.add_column(sa.Column("knowledge_source_id", sa.String(length=36), nullable=True))
        if "domains" not in document_columns:
            batch_op.add_column(sa.Column("domains", sa.JSON(), nullable=True))
        if "scenes" not in document_columns:
            batch_op.add_column(sa.Column("scenes", sa.JSON(), nullable=True))
        if "tags" not in document_columns:
            batch_op.add_column(sa.Column("tags", sa.JSON(), nullable=True))

    op.execute("UPDATE knowledge_documents SET domains = '[]' WHERE domains IS NULL")
    op.execute("UPDATE knowledge_documents SET scenes = '[]' WHERE scenes IS NULL")
    op.execute("UPDATE knowledge_documents SET tags = '[]' WHERE tags IS NULL")

    chunk_columns = {column["name"] for column in inspector.get_columns("knowledge_chunks")}
    with op.batch_alter_table("knowledge_chunks") as batch_op:
        if "embedding_dimensions" not in chunk_columns:
            batch_op.add_column(sa.Column("embedding_dimensions", sa.Integer(), nullable=True))
        if "embedding_status" not in chunk_columns:
            batch_op.add_column(sa.Column("embedding_status", sa.String(length=32), nullable=True))

    op.execute("UPDATE knowledge_chunks SET embedding_status = 'not-generated' WHERE embedding_status IS NULL")


def downgrade() -> None:
    inspector = inspect(op.get_bind())
    table_names = set(inspector.get_table_names())

    if "knowledge_chunks" in table_names:
        chunk_columns = {column["name"] for column in inspector.get_columns("knowledge_chunks")}
        with op.batch_alter_table("knowledge_chunks") as batch_op:
            if "embedding_status" in chunk_columns:
                batch_op.drop_column("embedding_status")
            if "embedding_dimensions" in chunk_columns:
                batch_op.drop_column("embedding_dimensions")

    if "knowledge_documents" in table_names:
        document_columns = {column["name"] for column in inspector.get_columns("knowledge_documents")}
        with op.batch_alter_table("knowledge_documents") as batch_op:
            if "tags" in document_columns:
                batch_op.drop_column("tags")
            if "scenes" in document_columns:
                batch_op.drop_column("scenes")
            if "domains" in document_columns:
                batch_op.drop_column("domains")
            if "knowledge_source_id" in document_columns:
                batch_op.drop_column("knowledge_source_id")

    if "knowledge_index_runs" in table_names:
        op.drop_table("knowledge_index_runs")
    if "knowledge_sources" in table_names:
        op.drop_table("knowledge_sources")
