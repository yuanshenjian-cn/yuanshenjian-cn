import { useEffect, useState } from "react";
import { SystemStatus, fetchSystemStatus } from "../api/client";

export function SystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    void fetchSystemStatus().then(setStatus);
  }, []);

  return (
    <section className="card">
      <h2>系统状态</h2>
      <p>API：{status?.api ?? "加载中"}</p>
      <p>DB：{status?.db ?? "加载中"}</p>
      <p>RAG 文档：{status?.rag_documents ?? "加载中"}</p>
      <p>RAG Chunks：{status?.rag_chunks ?? "加载中"}</p>
      <p>最近同步：{status?.last_rag_sync?.status ?? "无"}</p>
    </section>
  );
}
