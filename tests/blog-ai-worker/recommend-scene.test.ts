import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { chatMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
}));

vi.mock("../../blog-ai-worker/src/providers/index", () => ({
  createProvider: () => ({
    name: "mock-provider",
    chat: chatMock,
  }),
}));

import { handleRecommendScene } from "../../blog-ai-worker/src/scenes/recommend";
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

describe("handleRecommendScene", () => {
  beforeEach(() => {
    chatMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("提取半结构化 JSON 中的 answer，避免把原始 JSON 透传给前端", async () => {
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

    chatMock.mockResolvedValue({
      content: '{"answer":"先看《DeepSeek V4 的真正变量，不是 1.6 万亿参数》。","slugs":["deepseek-v4-preview"]',
    });

    const result = await handleRecommendScene("请推荐我博客里和 DeepSeek 相关的文章，并说明每篇文章分别适合关注什么问题。", env);

    expect(result.answer).toBe("先看《DeepSeek V4 的真正变量，不是 1.6 万亿参数》。");
    expect(result.answer.startsWith('{"answer"')).toBe(false);
    expect(result.references).toHaveLength(1);
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
              slug: "ai-post-2",
              title: "Claude Code 工作流",
              excerpt: "AI 编程配置与实践。",
              tags: ["Claude Code", "AI 编程"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-3",
              title: "Codex CLI 体验",
              excerpt: "终端 Agent 上手。",
              tags: ["Codex", "AI 编程"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-4",
              title: "Gemini 更新解读",
              excerpt: "厂商动态与能力变化。",
              tags: ["AI前沿"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-5",
              title: "MCP 实践笔记",
              excerpt: "工具协议和集成思路。",
              tags: ["AI 编程"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-6",
              title: "模型定价观察",
              excerpt: "推理成本与缓存命中。",
              tags: ["AI前沿"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-7",
              title: "OpenCode 配置指南",
              excerpt: "终端工具配置。",
              tags: ["OpenCode", "AI 编程"],
              date: "2026-05-01T00:00:00.000Z",
            },
            {
              slug: "ai-post-8",
              title: "RAG 方案比较",
              excerpt: "检索增强生成综述。",
              tags: ["AI 编程"],
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

    chatMock.mockResolvedValue({
      content: '{"answer":"先看《深入解读敏捷宣言》。","slugs":["agile-manifesto"]}',
    });

    await handleRecommendScene("请推荐我博客里和敏捷方法相关的文章，并说明分别适合团队实践中的哪些问题。", env);

    expect(chatMock).toHaveBeenCalledTimes(1);
    const [request] = chatMock.mock.calls[0];
    expect(request.messages[0].content).toContain("slug: agile-manifesto");
    expect(request.messages[0].content).not.toContain("slug: ai-post-1");
  });
});
