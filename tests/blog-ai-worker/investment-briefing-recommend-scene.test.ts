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

import { handleInvestmentBriefingRecommendSceneStream } from "../../blog-ai-worker/src/scenes/investment-briefing-recommend";
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

describe("handleInvestmentBriefingRecommendSceneStream", () => {
  beforeEach(() => {
    streamChatMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("只把日期范围内的投资简报放入推荐上下文，并返回 URL references", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          generated: "2099-01-08T00:00:00.000Z",
          items: [
            {
              slug: "2099-01-08",
              title: "投资简报 · 2099-01-08",
              brief: "英伟达发布测试动态。",
              tags: ["投资简报", "英伟达"],
              date: new Date().toISOString(),
              url: "/investment/briefings/2099-01-08",
            },
            {
              slug: "2000-01-01",
              title: "投资简报 · 2000-01-01",
              brief: "过期动态。",
              tags: ["投资简报"],
              date: "2000-01-01T00:00:00.000Z",
              url: "/investment/briefings/2000-01-01",
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
              'data: {"choices":[{"delta":{"content":"可先看最近这期，仍需自行判断。<<<INVESTMENT_BRIEFING_RECOMMEND_REFERENCES>>>{\\"slugs\\":[\\"2099-01-08\\"]}"}}]}\n\n',
            ),
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    const response = await handleInvestmentBriefingRecommendSceneStream("英伟达", "7d", env, "http://localhost:3000");

    expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/investment-data/briefings/index.json");
    expect(streamChatMock).toHaveBeenCalledTimes(1);
    const [request] = streamChatMock.mock.calls[0];
    expect(request.messages[0].content).toContain("slug: 2099-01-08");
    expect(request.messages[0].content).not.toContain("slug: 2000-01-01");
    expect(request.messages[0].content).toContain("不构成投资建议");

    const body = await response.text();
    expect(body).toContain("event: answer-delta");
    expect(body).toContain('"url":"/investment/briefings/2099-01-08"');
  });
});
