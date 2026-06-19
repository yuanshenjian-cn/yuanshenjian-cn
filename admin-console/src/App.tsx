import { useEffect, useState } from "react";
import { fetchMe, logout } from "./api/client";
import { AiUsagePage } from "./pages/AiUsagePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CommentsPage } from "./pages/CommentsPage";
import { GlossaryPage } from "./pages/GlossaryPage";
import { KnowledgeBasePage } from "./pages/KnowledgeBasePage";
import { LoginPage } from "./pages/LoginPage";
import { SystemPage } from "./pages/SystemPage";

type Page = "login" | "comments" | "analytics" | "ai-usage" | "knowledge-base" | "glossary" | "system";

const pages: Array<{ key: Page; label: string }> = [
  { key: "glossary", label: "术语库" },
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
      .then(() => setPage("glossary"))
      .catch(() => setPage("login"))
      .finally(() => setReady(true));
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setPage("login");
    }
  }

  if (!ready) {
    return null;
  }

  if (page === "login") {
    return (
      <main className="login-shell">
        <LoginPage onLoggedIn={() => setPage("glossary")} />
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>博客管理控制台</h1>
        </div>
        <nav className="nav">
          {pages.map((item) => (
            <button
              key={item.key}
              className={page === item.key ? "active" : ""}
              onClick={() => setPage(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout" onClick={handleLogout}>退出登录</button>
        </div>
      </aside>
      <main className="content">
        {page === "comments" && <CommentsPage />}
        {page === "analytics" && <AnalyticsPage />}
        {page === "ai-usage" && <AiUsagePage />}
        {page === "knowledge-base" && <KnowledgeBasePage />}
        {page === "glossary" && <GlossaryPage />}
        {page === "system" && <SystemPage />}
      </main>
    </div>
  );
}
