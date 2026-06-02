from __future__ import annotations

from app.contexts.comment.domain.comment import CommentModerationDecision, CommentStatus


class SimpleCommentModerationService:
    def evaluate(self, content: str, moderation_available: bool = True) -> CommentModerationDecision:
        lowered = content.lower()
        spam_markers = ["http://", "https://", "加微信", "优惠", "casino"]
        score = 0.75 if any(marker in lowered for marker in spam_markers) else 0.1
        recommended = CommentStatus.SPAM if score >= 0.75 else CommentStatus.PENDING
        if not moderation_available:
            return CommentModerationDecision(
                recommended_status=CommentStatus.PENDING,
                score=0.0,
                labels=["moderation_unavailable"],
                reason="moderation_unavailable",
            )
        return CommentModerationDecision(
            recommended_status=recommended,
            score=score,
            labels=["spam"] if recommended is CommentStatus.SPAM else [],
            reason="包含广告特征" if recommended is CommentStatus.SPAM else "未发现明显风险",
        )
