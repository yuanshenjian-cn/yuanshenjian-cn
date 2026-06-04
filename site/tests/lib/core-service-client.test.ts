import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  config: {
    ai: {
      coreServiceUrl: "https://api.example.com",
    },
  },
}));

import { fetchArticleStats, fetchComments, submitComment } from "@/lib/core-service-client";

describe("core-service-client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchComments 请求正式评论接口", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "1", article_slug: "slug", parent_id: null, display_name: "tester", content_html: "<p>hello</p>", status: "approved", created_at: "2026-01-01T00:00:00.000Z", replies: [] }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const comments = await fetchComments("slug");

    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/api/v1/articles/slug/comments", {
      credentials: "include",
    });
    expect(comments).toHaveLength(1);
    expect(comments[0]?.display_name).toBe("tester");
  });

  it("fetchArticleStats 请求只读统计接口", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ article_slug: "slug", pv: 123, uv: 45 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const stats = await fetchArticleStats("slug");

    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/api/v1/articles/slug/stats", {
      credentials: "include",
    });
    expect(stats).toEqual({ article_slug: "slug", pv: 123, uv: 45 });
  });

  it("submitComment 发送评论创建请求", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "1", status: "pending", message: "评论已提交，审核后展示。" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ok = await submitComment("slug", {
      displayName: "tester",
      email: "tester@example.com",
      content: "hello",
      turnstileToken: "token",
      parentId: "parent-1",
    });

    expect(fetchSpy).toHaveBeenCalledWith("https://api.example.com/api/v1/articles/slug/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parent_id: "parent-1",
        display_name: "tester",
        email: "tester@example.com",
        content_markdown: "hello",
        turnstile_token: "token",
      }),
    });
    expect(ok).toBe(true);
  });
});
