import { describe, expect, it, vi, afterEach } from "vitest";
import { aiChat } from "@/lib/ai-client";

describe("aiChat", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post recommend request and parse response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "推荐你先看 TDD 相关文章。",
          references: [
            {
              slug: "tdd-introduction",
              title: "TDD 入门",
              excerpt: "从最小反馈回路开始理解 TDD。",
              tags: ["TDD"],
              date: "2026-05-02T00:00:00.000Z",
            },
          ],
          usage: {
            promptTokens: 12,
            completionTokens: 8,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const result = await aiChat({
      workerUrl: "/api/ai/",
      scene: "recommend",
      message: "推荐几篇 TDD 文章",
      turnstileToken: "turnstile-token",
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "recommend",
        message: "推荐几篇 TDD 文章",
        context: undefined,
        cf_turnstile_response: "turnstile-token",
      }),
    });
    expect(result.answer).toContain("TDD");
    expect(result.references).toHaveLength(1);
  });

  it("should surface readable server errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Turnstile verification failed" }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(
      aiChat({
        workerUrl: "/api/ai",
        scene: "recommend",
        message: "推荐几篇文章",
        turnstileToken: "bad-token",
      }),
    ).rejects.toThrow("Turnstile verification failed");
  });
});
