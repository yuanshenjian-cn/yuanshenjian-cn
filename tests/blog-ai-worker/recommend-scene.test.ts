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

import { handleRecommendSceneStream } from "../../blog-ai-worker/src/scenes/recommend";
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

describe("handleRecommendSceneStream", () => {
  beforeEach(() => {
    streamChatMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("index 数据加载失败时返回统一友好错误", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("upstream failed", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );

    await expect(
      handleRecommendSceneStream(
        "请推荐我博客里和 DeepSeek 相关的文章，并说明每篇文章分别适合关注什么问题。",
        env,
        "http://localhost:3000",
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "AI 服务刚刚开小差了，请稍后重试。",
    });
  });

  it("为敏捷方法快捷词提取中文主题关键词，避免退化成默认兜底列表", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          generated: "2026-05-04T00:00:00.000Z",
          posts: [
            {
              slug: "ai-post-1",
              title: "OpenAI 新模型速读",
              excerpt: "模型发布动态汇总。",
              tags: ["OpenAI", "AI前沿"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "agile-manifesto",
              title: "深入解读敏捷宣言",
              excerpt: "从价值观、原则与团队协作理解敏捷方法。",
              tags: ["敏捷教练"],
              date: "2026-05-01T00:00:00.000Z",
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    streamChatMock.mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"先看《深入解读敏捷宣言》。<<<AI_RECOMMEND_REFERENCES>>>{\\"slugs\\":[\\"agile-manifesto\\"]}"}}]}\n\n',
            ),
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    await handleRecommendSceneStream(
      "请推荐我博客里和敏捷方法相关的文章，并说明分别适合团队实践中的哪些问题。",
      env,
      "http://localhost:3000",
    );

    expect(streamChatMock).toHaveBeenCalledTimes(1);
    const [request] = streamChatMock.mock.calls[0];
    expect(request.messages[0].content).toContain("slug: agile-manifesto");
    expect(request.messages[0].content).not.toContain("slug: ai-post-1");
  });

  it("recommend stream 先输出 answer-delta，再在末尾一次性返回 references", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          generated: "2026-05-04T00:00:00.000Z",
          posts: [
            {
              slug: "deepseek-v4-preview",
              title: "DeepSeek V4 的真正变量，不是 1.6 万亿参数",
              excerpt: "分析 DeepSeek V4 的能力边界与使用场景。",
              tags: ["DeepSeek", "AI前沿"],
              date: "2026-04-24T00:00:00.000Z",
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    streamChatMock.mockResolvedValueOnce(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              'data: {"choices":[{"delta":{"content":"先看--这篇文章。<<<AI_RECOMMEND_REFERENCES>>>{\\"slugs\\":[\\"deepseek-v4-preview\\"]}"}}]}\n\n',
            ),
          );
          controller.enqueue(new TextEncoder().encode('data: {"usage":{"completion_tokens":12}}\n\n'));
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      }),
    );

    const response = await handleRecommendSceneStream(
      "请推荐我博客里和 DeepSeek 相关的文章，并说明每篇文章分别适合关注什么问题。",
      env,
      "http://localhost:3000",
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const body = await response.text();
    expect(body).toContain('event: answer-delta\ndata: {"delta":"先看——这篇文章。"}');
    expect(body).toContain('event: references\ndata: {"references":[{"slug":"deepseek-v4-preview"');
    expect(body).toContain('event: done\ndata: {"usage":{"completionTokens":12}}');
  });

  it("上游流处理中断时返回统一友好错误文案", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          generated: "2026-05-04T00:00:00.000Z",
          posts: [
            {
              slug: "deepseek-v4-preview",
              title: "DeepSeek V4 的真正变量，不是 1.6 万亿参数",
              excerpt: "分析 DeepSeek V4 的能力边界与使用场景。",
              tags: ["DeepSeek", "AI前沿"],
              date: "2026-04-24T00:00:00.000Z",
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    streamChatMock.mockResolvedValueOnce(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"先给你一个方向。"}}]}\n\n'));
          controller.error(new Error("stream interrupted"));
        },
      }),
    );

    const response = await handleRecommendSceneStream(
      "请推荐我博客里和 DeepSeek 相关的文章，并说明每篇文章分别适合关注什么问题。",
      env,
      "http://localhost:3000",
    );

    const body = await response.text();
    expect(body).toContain('event: error\ndata: {"message":"AI 服务刚刚开小差了，请稍后重试。"}');
  });
});
