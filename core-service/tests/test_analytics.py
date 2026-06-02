from datetime import date

from app.contexts.article_analytics.domain.article_daily_stats import ArticleDailyStats


def test_daily_stats_counts_pv_and_unique_visitors() -> None:
    stats = ArticleDailyStats(article_slug="hello", stat_date=date(2026, 6, 2))
    stats.record_view(is_unique_visitor=True)
    stats.record_view(is_unique_visitor=False)
    stats.record_view(is_unique_visitor=True)
    assert stats.pv_count == 3
    assert stats.uv_count == 2
