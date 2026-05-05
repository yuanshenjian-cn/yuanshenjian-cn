import { afterEach, describe, expect, it, vi } from "vitest";

import worker from "../../blog-ai-worker/src/index";
import type { Env, ExecutionContext } from "../../blog-ai-worker/src/types";

const env: Env = {
  RATE_LIMIT_KV: {
    get: async () => null,
    put: async () => undefined,
  },
  LLM_ACTIVE_PROFILE: "deepseek/deepseek-v4-flash",
  LLM_PROVIDER_NAME: "deepseek",
  LLM_MODEL_ID: "deepseek-v4-flash",
  LLM_PROVIDER_API_KEY: "test-key",
  LLM_PROVIDER_BASE_URL: "https://example.com/v1",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  TURNSTILE_ALLOWED_HOSTNAMES: "localhost",
  ALLOWED_ORIGINS: "http://localhost:3000",
  AI_DATA_BASE_URL: "https://example.com/ai-data",
};

const executionContext: ExecutionContext = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
};

function createStreamRequest(body: Record<string, unknown>): Request {
  return new Request("https://example.com/api/ai/chat/stream", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("Worker runtime env validation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    "LLM_ACTIVE_PROFILE",
    "LLM_PROVIDER_NAME",
    "LLM_MODEL_ID",
    "LLM_PROVIDER_API_KEY",
    "LLM_PROVIDER_BASE_URL",
  ] as const)("缺失 %s 时直接返回配置错误", async (key) => {
    const response = await worker.fetch(
      createStreamRequest({
        scene: "recommend",
        message: "hello",
        cf_turnstile_response: "token",
      }),
      {
        ...env,
        [key]: "",
      },
      executionContext,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: `Worker misconfigured: ${key} is missing`,
    });
  });

  it("/chat 已删除，只保留 /chat/stream", async () => {
    const response = await worker.fetch(
      new Request("https://example.com/api/ai/chat", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scene: "recommend",
          message: "hello",
          cf_turnstile_response: "token",
        }),
      }),
      env,
      executionContext,
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Not found" });
  });

  it("/chat/stream 支持 recommend scene 并返回 SSE content type", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "localhost",
            action: "homepage_recommend",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            generated: "2026-05-05T00:00:00.000Z",
            posts: [
              {
                slug: "demo-post",
                title: "示例文章",
                excerpt: "摘要",
                tags: ["AI"],
                date: "2026-05-05T00:00:00.000Z",
              },
            ],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"回答正文<<<AI_RECOMMEND_REFERENCES>>>{\\"slugs\\":[\\"demo-post\\"]}"}}]}\n\n',
                ),
              );
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
      );

    const response = await worker.fetch(
      createStreamRequest({
        scene: "recommend",
        message: "hello",
        cf_turnstile_response: "token",
      }),
      env,
      executionContext,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const body = await response.text();
    expect(body).toContain("event: answer-delta");
    expect(body).toContain("event: references");
    expect(body).toContain("event: done");
  });

  it("/chat/stream 成功时返回 SSE content type", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "localhost",
            action: "article_page_ai",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            slug: "demo",
            title: "示例文章",
            date: "2026-05-05T00:00:00.000Z",
            excerpt: "摘要",
            tags: ["AI"],
            sections: [{ id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" }],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(
                new TextEncoder().encode(
                  'data: {"choices":[{"delta":{"content":"回答--正文<<<AI_PAGE_REFERENCES>>>{\\"sectionIds\\":[\\"intro\\"]}"}}]}\n\n',
                ),
              );
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              controller.close();
            },
          }),
          { headers: { "Content-Type": "text/event-stream" } },
        ),
      );

    const response = await worker.fetch(
      createStreamRequest({
        scene: "article",
        message: "3 行总结这篇文章",
        context: { slug: "demo" },
        cf_turnstile_response: "token",
      }),
      env,
      executionContext,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const body = await response.text();
    expect(body).toContain("event: answer-delta");
    expect(body).toContain('event: answer-delta\ndata: {"delta":"回答——正文"}');
    expect(body).toContain("event: references");
    expect(body).toContain("event: done");
  });

  it("/chat/stream 在流式响应创建前失败时返回统一友好错误", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            hostname: "localhost",
            action: "article_page_ai",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            slug: "demo",
            title: "示例文章",
            date: "2026-05-05T00:00:00.000Z",
            excerpt: "摘要",
            tags: ["AI"],
            sections: [{ id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" }],
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "provider stream failed" } }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const response = await worker.fetch(
      createStreamRequest({
        scene: "article",
        message: "3 行总结这篇文章",
        context: { slug: "demo" },
        cf_turnstile_response: "token",
      }),
      env,
      executionContext,
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "AI 服务刚刚开小差了，请稍后重试。",
    });
  });
});
