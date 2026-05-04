import { afterEach, describe, expect, it, vi } from "vitest";

import { aiChat, aiChatStream } from "@/lib/ai-client";

function createStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    },
  );
}

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
        cf_turnstile_response: "turnstile-token",
      }),
    });
    expect(result.answer).toContain("TDD");
    expect(result.references).toHaveLength(1);
  });

  it("should support page scene non-stream fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          answer: "这篇文章主要讨论 TDD 的反馈回路。",
          references: [
            {
              id: "intro",
              title: "前言",
              excerpt: "从反馈回路理解 TDD。",
              sourceType: "article-section",
              anchorId: "intro",
            },
          ],
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
      workerUrl: "/api/ai",
      scene: "article",
      message: "3 行总结这篇文章",
      context: { slug: "tdd-introduction" },
      turnstileToken: "turnstile-token",
    });

    expect(result.references[0]).toMatchObject({
      id: "intro",
      sourceType: "article-section",
    });
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

describe("aiChatStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse answer delta across multiple chunks", async () => {
    const onEvent = vi.fn();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        "event: answer-delta\ndata: {\"delta\":\"这篇文章\"}\n\n",
        "event: answer-delta\ndata: {\"delta\":\"主要讨论测试反馈。\"}\n\n",
        "event: references\ndata: {\"references\":[{\"id\":\"intro\",\"title\":\"前言\",\"excerpt\":\"从反馈回路理解 TDD。\",\"sourceType\":\"article-section\",\"anchorId\":\"intro\"}]}\n\n",
        "event: done\ndata: {\"usage\":{\"promptTokens\":10}}\n\n",
      ]),
    );

    await aiChatStream({
      workerUrl: "/api/ai",
      scene: "article",
      message: "3 行总结这篇文章",
      context: { slug: "tdd-introduction" },
      turnstileToken: "token",
      onEvent,
    });

    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "这篇文章" });
    expect(onEvent).toHaveBeenNthCalledWith(2, { type: "answer-delta", delta: "主要讨论测试反馈。" });
    expect(onEvent).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: "references",
      }),
    );
    expect(onEvent).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        type: "done",
      }),
    );
  });

  it("should parse events when one SSE event is split into multiple chunks", async () => {
    const onEvent = vi.fn();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        "event: answer-delta\nda",
        "ta: {\"delta\":\"分块回答\"}\n\n",
        "event: done\ndata: {}\n\n",
      ]),
    );

    await aiChatStream({
      workerUrl: "/api/ai",
      scene: "author",
      message: "作者擅长什么方向",
      context: { page: "author" },
      turnstileToken: "token",
      onEvent,
    });

    expect(onEvent).toHaveBeenCalledWith({ type: "answer-delta", delta: "分块回答" });
    expect(onEvent).toHaveBeenCalledWith({ type: "done", usage: undefined });
  });

  it("should reject malformed events", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        "event: references\ndata: {\"references\":[{\"id\":1}]}\n\n",
      ]),
    );

    await expect(
      aiChatStream({
        workerUrl: "/api/ai",
        scene: "article",
        message: "3 行总结这篇文章",
        context: { slug: "tdd-introduction" },
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("Invalid references event payload");
  });

  it("should throw AIStreamUnsupportedError for 501 stream responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Current AI provider does not support streaming" }), {
        status: 501,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(
      aiChatStream({
        workerUrl: "/api/ai",
        scene: "author",
        message: "作者擅长什么方向",
        context: { page: "author" },
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toMatchObject({ name: "AIStreamUnsupportedError" });
  });
});
