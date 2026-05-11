import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { streamChatMock } = vi.hoisted(() => ({
  streamChatMock: vi.fn(),
}));

vi.mock("../../blog-ai-worker/src/providers/index", () => ({
  createProvider: () => ({
    name: "mock-provider",
    chat: vi.fn(),
    streamChat: streamChatMock,
  }),
}));

import { handleBriefingRecommendSceneStream } from "../../blog-ai-worker/src/scenes/briefing-recommend";
import type { Env } from "../../blog-ai-worker/src/types";

const env: Env = {
  RATE_LIMIT_KV: {
    get: vi.fn(),
    put: vi.fn(),
  },
  LLM_ACTIVE_PROFILE: "deepseek/deepseek-v4-flash",
  LLM_PROVIDER_NAME: "deepseek",
  LLM_MODEL_ID: "deepseek-v4-flash",
  LLM_PROVIDER_API_KEY: "test-key",
  LLM_PROVIDER_BASE_URL: "https://example.com",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  TURNSTILE_ALLOWED_HOSTNAMES: "localhost",
  ALLOWED_ORIGINS: "http://localhost:3000",
  AI_DATA_BASE_URL: "https://example.com/ai-data",
};

describe("handleBriefingRecommendSceneStream", () => {
  beforeEach(() => {
    streamChatMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("只把日期范围内的简报放入推荐上下文，并返回 URL references", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          generated: "2099-01-08T00:00:00.000Z",
          briefings: [
            {
              slug: "2099-01-08",
              title: "AI 简报 · 2099-01-08",
              excerpt: "OpenAI 发布测试动态。",
              tags: ["AI简报", "OpenAI"],
              date: new Date().toISOString(),
              url: "/ai/briefings/2099-01-08",
            },
            {
              slug: "2000-01-01",
              title: "AI 简报 · 2000-01-01",
              excerpt: "过期动态。",
              tags: ["AI简报"],
              date: "2000-01-01T00:00:00.000Z",
              url: "/ai/briefings/2000-01-01",
            },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    streamChatMock.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"推荐今天这期。<<<AI_BRIEFING_RECOMMEND_REFERENCES>>>{\\"slugs\\":[\\"2099-01-08\\"]}"}}]}\n\n',
            ),
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    const response = await handleBriefingRecommendSceneStream("OpenAI", "7d", env, "http://localhost:3000");

    expect(streamChatMock).toHaveBeenCalledTimes(1);
    const [request] = streamChatMock.mock.calls[0];
    expect(request.messages[0].content).toContain("slug: 2099-01-08");
    expect(request.messages[0].content).not.toContain("slug: 2000-01-01");

    const body = await response.text();
    expect(body).toContain("event: answer-delta");
    expect(body).toContain('"url":"/ai/briefings/2099-01-08"');
  });
});
