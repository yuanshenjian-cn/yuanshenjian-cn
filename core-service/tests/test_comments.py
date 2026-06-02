from datetime import UTC, datetime

from app.contexts.comment.domain.comment import ArticleComment, CommentStatus
from app.contexts.comment.infra.comment_markdown_renderer import CommentMarkdownRenderer


def test_render_safe_markdown_removes_script() -> None:
    html = CommentMarkdownRenderer().render("hello <script>alert(1)</script> **world**")
    assert "script" not in html.lower()
    assert "<strong>world</strong>" in html


def test_reply_depth_rejects_reply_to_reply() -> None:
    parent = ArticleComment(
        id="1",
        article_slug="slug",
        parent_id=None,
        actor_type="visitor",
        visitor_id="visitor-1",
        user_id=None,
        display_name="tester",
        email_hash=None,
        content_markdown="hello",
        content_html="<p>hello</p>",
        status=CommentStatus.PENDING,
        ai_moderation_recommended_status=None,
        ai_moderation_score=None,
        ai_moderation_labels=[],
        ai_moderation_reason=None,
        ip_hash=None,
        user_agent_hash=None,
        reviewed_by=None,
        review_note=None,
        reviewed_at=None,
        created_at=datetime.now(UTC),
        updated_at=None,
    )
    child = ArticleComment(
        **{**parent.__dict__, "id": "2", "parent_id": "1"},
    )
    assert parent.can_accept_reply() is True
    assert child.can_accept_reply() is False
