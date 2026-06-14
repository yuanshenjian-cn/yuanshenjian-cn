import { useEffect, useState } from "react";
import { fetchMe } from "./api/client";
import { AiUsagePage } from "./pages/AiUsagePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CommentsPage } from "./pages/CommentsPage";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { LoginPage } from "./pages/LoginPage";
import { SystemPage } from "./pages/SystemPage";

type Page = "login" | "comments" | "analytics" | "ai-usage" | "knowledge-base" | "system";

const pages: Array<{ key: Page; label: string }> = [
  { key: "comments", label: "评论审核" },
  { key: "analytics", label: "阅读统计" },
  { key: "ai-usage", label: "AI 用量" },
  { key: "knowledge-base", label: "知识库" },
  { key: "system", label: "系统状态" },
];

export function App() {
  const [page, setPage] = useState<Page>("login");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchMe()
      .then(() => setPage("comments"))
      .catch(() => setPage("login"))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <main className="shell">
      <h1>博客管理控制台</h1>
      {page !== "login" ? (
        <nav className="nav">
          {pages.map((item) => (
            <button key={item.key} className={page === item.key ? "active" : ""} onClick={() => setPage(item.key)}>
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}
      {page === "login" && <LoginPage onLoggedIn={() => setPage("comments")} />}
      {page === "comments" && <CommentsPage />}
      {page === "analytics" && <AnalyticsPage />}
      {page === "ai-usage" && <AiUsagePage />}
      {page === "knowledge-base" && <KnowledgeBasePage />}
      {page === "system" && <SystemPage />}
    </main>
  );
}
