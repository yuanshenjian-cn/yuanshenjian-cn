import { useEffect, useState } from "react";
import { AdminOverview, fetchOverview } from "../api/client";

export function AnalyticsPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    void fetchOverview().then(setOverview);
  }, []);

  return (
    <section>
      <h2>阅读统计</h2>
      <div className="grid">
        <div className="card">总 PV：{overview?.total_pv ?? "加载中"}</div>
        <div className="card">今日 PV：{overview?.today_pv ?? "加载中"}</div>
        <div className="card">已通过评论：{overview?.approved_comments ?? "加载中"}</div>
        <div className="card">待审核评论：{overview?.pending_comments ?? "加载中"}</div>
      </div>
    </section>
  );
}
