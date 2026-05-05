import { afterEach, describe, expect, it, vi } from "vitest";

import { aiChatStream, aiRecommendStream } from "@/lib/ai-client";

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

describe("aiChatStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse answer delta across multiple chunks", async () => {
    const onEvent = vi.fn();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"这篇文章"}\n\n',
        'event: answer-delta\ndata: {"delta":"主要讨论测试反馈。"}\n\n',
        'event: references\ndata: {"references":[{"id":"intro","title":"前言","excerpt":"从反馈回路理解 TDD。","sourceType":"article-section","anchorId":"intro"}]}\n\n',
        'event: done\ndata: {"usage":{"promptTokens":10}}\n\n',
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
    expect(onEvent).toHaveBeenNthCalledWith(3, expect.objectContaining({ type: "references" }));
    expect(onEvent).toHaveBeenNthCalledWith(4, expect.objectContaining({ type: "done" }));
  });

  it("should parse events when one SSE event is split into multiple chunks", async () => {
    const onEvent = vi.fn();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        "event: answer-delta\nda",
        'ta: {"delta":"分块回答"}\n\n',
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
      createStreamResponse(['event: references\ndata: {"references":[{"id":1}]}\n\n']),
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

  it("should surface readable server errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "AI 服务刚刚开小差了，请稍后重试。" }), {
        status: 502,
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
    ).rejects.toThrow("AI 服务刚刚开小差了，请稍后重试。");
  });
});

describe("aiRecommendStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post recommend stream request and parse recommend references", async () => {
    const onEvent = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"先看 TDD 相关文章。"}\n\n',
        'event: references\ndata: {"references":[{"slug":"tdd-introduction","title":"TDD 入门","excerpt":"从最小反馈回路开始理解 TDD。","tags":["TDD"],"date":"2026-05-02T00:00:00.000Z"}]}\n\n',
        'event: done\ndata: {"usage":{"completionTokens":8}}\n\n',
      ]),
    );

    await aiRecommendStream({
      workerUrl: "/api/ai/",
      scene: "recommend",
      message: "推荐几篇 TDD 文章",
      turnstileToken: "token",
      onEvent,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/ai/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "recommend",
        message: "推荐几篇 TDD 文章",
        cf_turnstile_response: "token",
      }),
      signal: undefined,
    });
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "先看 TDD 相关文章。" });
    expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: "references" }));
    expect(onEvent).toHaveBeenNthCalledWith(3, { type: "done", usage: { completionTokens: 8 } });
  });

  it("should reject malformed recommend references", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse(['event: references\ndata: {"references":[{"slug":1}]}\n\n']),
    );

    await expect(
      aiRecommendStream({
        workerUrl: "/api/ai",
        scene: "recommend",
        message: "推荐几篇文章",
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("Invalid references event payload");
  });

  it("should surface recommend server errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "AI 服务刚刚开小差了，请稍后重试。" }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    await expect(
      aiRecommendStream({
        workerUrl: "/api/ai",
        scene: "recommend",
        message: "推荐几篇文章",
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("AI 服务刚刚开小差了，请稍后重试。");
  });
});
