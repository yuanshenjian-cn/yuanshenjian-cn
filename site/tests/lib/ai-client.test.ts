import { afterEach, describe, expect, it, vi } from "vitest";

import {
  aiArticleRecommendationStream,
  aiBriefingRecommendationStream,
  aiChatStream,
  aiContextualAdvisorStream,
  aiInvestmentBriefingRecommendationStream,
} from "@/lib/ai-client";

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
      workerUrl: "/api/v1/ai-assistant",
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
      workerUrl: "/api/v1/ai-assistant",
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
        workerUrl: "/api/v1/ai-assistant",
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
        workerUrl: "/api/v1/ai-assistant",
        scene: "author",
        message: "作者擅长什么方向",
        context: { page: "author" },
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("AI 服务刚刚开小差了，请稍后重试。");
  });
});

describe("aiArticleRecommendationStream", () => {
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

    await aiArticleRecommendationStream({
      workerUrl: "/api/v1/ai-assistant/",
      scene: "article_recommendation",
      message: "推荐几篇 TDD 文章",
      turnstileToken: "token",
      onEvent,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/ai-assistant/chat/stream", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "article_recommendation",
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
      aiArticleRecommendationStream({
        workerUrl: "/api/v1/ai-assistant",
        scene: "article_recommendation",
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
      aiArticleRecommendationStream({
        workerUrl: "/api/v1/ai-assistant",
        scene: "article_recommendation",
        message: "推荐几篇文章",
        turnstileToken: "token",
        onEvent: vi.fn(),
      }),
    ).rejects.toThrow("AI 服务刚刚开小差了，请稍后重试。");
  });
});

describe("aiContextualAdvisorStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post advisor stream request and parse advisor references", async () => {
    const onEvent = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"建议先看当前栏目导读。"}\n\n',
        'event: references\ndata: {"references":[{"id":"ref-1","title":"当前栏目导读","excerpt":"先看阅读路径。","sourceType":"ai-section","url":"/articles/ai-guide"}]}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    await aiContextualAdvisorStream({
      workerUrl: "/api/v1/ai-assistant/",
      message: "我该先看什么",
      turnstileToken: "token",
      context: {
        scene: "ai-column",
        domain: "ai",
        pageTitle: "OpenCode",
        pageSlug: "opencode",
        articleSlug: undefined,
        history: ["之前看过一篇入门文章"],
      },
      onEvent,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/ai-assistant/advisor/stream", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "ai-column",
        domain: "ai",
        page_title: "OpenCode",
        page_slug: "opencode",
        article_slug: undefined,
        history: ["之前看过一篇入门文章"],
        entrypoint: "ai-column",
        message: "我该先看什么",
        cf_turnstile_response: "token",
      }),
      signal: undefined,
    });
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "建议先看当前栏目导读。" });
    expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: "references" }));
    expect(onEvent).toHaveBeenNthCalledWith(3, { type: "done", usage: undefined });
  });

  it("should parse followup-questions event", async () => {
    const onEvent = vi.fn();

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"回答正文"}\n\n',
        'event: followup-questions\ndata: {"questions":["问题 1","问题 2","问题 3"]}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    await aiContextualAdvisorStream({
      workerUrl: "/api/v1/ai-assistant/",
      message: "测试",
      turnstileToken: "token",
      context: {
        scene: "ai-column",
        domain: "ai",
        pageTitle: "OpenCode",
        pageSlug: "opencode",
        articleSlug: undefined,
        history: [],
      },
      onEvent,
    });

    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "回答正文" });
    expect(onEvent).toHaveBeenNthCalledWith(2, {
      type: "followup-questions",
      questions: ["问题 1", "问题 2", "问题 3"],
    });
    expect(onEvent).toHaveBeenNthCalledWith(3, { type: "done", usage: undefined });
  });
});

describe("aiBriefingRecommendationStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post briefing recommend stream request with range context and parse URL references", async () => {
    const onEvent = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"可以先看今天的 OpenAI 简报。"}\n\n',
        'event: references\ndata: {"references":[{"slug":"2099-01-01","title":"AI 简报 · 2099-01-01","excerpt":"测试摘要","tags":["AI简报"],"date":"2099-01-01T00:00:00.000Z","url":"/ai/briefings/2099-01-01"}]}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    await aiBriefingRecommendationStream({
      workerUrl: "/api/v1/ai-assistant/",
      scene: "ai_briefing_recommendation",
      message: "OpenAI",
      context: { range: "7d" },
      turnstileToken: "token",
      onEvent,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/ai-assistant/chat/stream", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "ai_briefing_recommendation",
        message: "OpenAI",
        context: { range: "7d" },
        cf_turnstile_response: "token",
      }),
      signal: undefined,
    });
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "可以先看今天的 OpenAI 简报。" });
    expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: "references" }));
    expect(onEvent).toHaveBeenNthCalledWith(3, { type: "done", usage: undefined });
  });
});

describe("aiInvestmentBriefingRecommendationStream", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should post investment briefing recommend stream request with range context and parse URL references", async () => {
    const onEvent = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createStreamResponse([
        'event: answer-delta\ndata: {"delta":"可以先看最近的半导体投资简报。"}\n\n',
        'event: references\ndata: {"references":[{"slug":"2099-01-02","title":"投资简报 · 2099-01-02","excerpt":"测试摘要","tags":["投资简报"],"date":"2099-01-02T00:00:00.000Z","url":"/investment/briefings/2099-01-02"}]}\n\n',
        'event: done\ndata: {}\n\n',
      ]),
    );

    await aiInvestmentBriefingRecommendationStream({
      workerUrl: "/api/v1/ai-assistant/",
      scene: "investment_briefing_recommendation",
      message: "半导体",
      context: { range: "14d" },
      turnstileToken: "token",
      onEvent,
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/v1/ai-assistant/chat/stream", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene: "investment_briefing_recommendation",
        message: "半导体",
        context: { range: "14d" },
        cf_turnstile_response: "token",
      }),
      signal: undefined,
    });
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: "answer-delta", delta: "可以先看最近的半导体投资简报。" });
    expect(onEvent).toHaveBeenNthCalledWith(2, expect.objectContaining({ type: "references" }));
    expect(onEvent).toHaveBeenNthCalledWith(3, { type: "done", usage: undefined });
  });
});
