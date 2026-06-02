import { useEffect, useState } from "react";
import { AdminCommentItem, fetchComments, reviewComment } from "../api/client";

export function CommentsPage() {
  const [items, setItems] = useState<AdminCommentItem[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const response = await fetchComments("pending");
      setItems(response.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载失败");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleReview(id: string, action: "approve" | "reject" | "mark-spam") {
    await reviewComment(id, action);
    await load();
  }

  return (
    <section>
      <h2>待审核评论</h2>
      {error ? <p className="error">{error}</p> : null}
      {items.map((item) => (
        <article className="card" key={item.id}>
          <h3>{item.display_name}</h3>
          <p>{item.content_markdown}</p>
          <p>文章：{item.article_slug}</p>
          <p>AI 建议：{item.ai_moderation_recommended_status ?? "无"}</p>
          <button onClick={() => void handleReview(item.id, "approve")}>批准</button>{" "}
          <button onClick={() => void handleReview(item.id, "reject")}>拒绝</button>{" "}
          <button onClick={() => void handleReview(item.id, "mark-spam")}>Spam</button>
        </article>
      ))}
    </section>
  );
}
