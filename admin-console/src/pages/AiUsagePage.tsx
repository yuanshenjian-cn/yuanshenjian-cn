import { useEffect, useState } from "react";
import { fetchAiUsage } from "../api/client";

export function AiUsagePage() {
  const [totalRequests, setTotalRequests] = useState<number | null>(null);

  useEffect(() => {
    void fetchAiUsage().then((usage) => setTotalRequests(usage.total_requests));
  }, []);

  return (
    <section className="card">
      <h2>AI 用量</h2>
      <p>总请求数：{totalRequests ?? "加载中"}</p>
    </section>
  );
}
