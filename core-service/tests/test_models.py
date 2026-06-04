from app.contexts.comment.infra.po.article_comment_po import ArticleCommentPO
from app.contexts.knowledge_base.infra.po.knowledge_chunk_po import KnowledgeChunkPO
from app.contexts.knowledge_base.infra.po.knowledge_document_po import KnowledgeDocumentPO
from app.contexts.knowledge_base.infra.po.rag_sync_run_po import RagSyncRunPO
from app.shared.infra.persistence.base import Base
import app.shared.infra.persistence.model_registry as _persistence_model_registry  # noqa: F401


def test_v1_schema_contains_required_tables() -> None:
    required = {
        "visitors",
        "users",
        "auth_identities",
        "admin_sessions",
        "knowledge_documents",
        "knowledge_chunks",
        "rag_sync_runs",
        "comments",
        "article_view_events",
        "article_view_daily_stats",
        "ai_conversations",
        "ai_messages",
        "ai_request_events",
        "rag_query_events",
        "daily_budget_usage",
    }
    assert required.issubset(Base.metadata.tables.keys())


def test_knowledge_upsert_constraints_exist() -> None:
    doc_constraints = {constraint.name for constraint in KnowledgeDocumentPO.__table__.constraints}
    chunk_constraints = {constraint.name for constraint in KnowledgeChunkPO.__table__.constraints}
    assert "uq_knowledge_documents_source" in doc_constraints
    assert "uq_knowledge_chunks_document_index" in chunk_constraints


def test_comment_review_and_ai_moderation_fields_exist() -> None:
    columns = set(ArticleCommentPO.__table__.columns.keys())
    assert {"visitor_id", "user_id", "ip_hash", "user_agent_hash"}.issubset(columns)
    assert {"ai_moderation_recommended_status", "reviewed_by", "reviewed_at"}.issubset(columns)


def test_rag_sync_run_tracks_result() -> None:
    columns = set(RagSyncRunPO.__table__.columns.keys())
    assert {"status", "commit_sha", "documents_seen", "chunks_upserted", "error_message"}.issubset(columns)
