import { afterEach, describe, expect, it, vi } from "vitest";

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

import { buildArticleSystemPrompt } from "../../blog-ai-worker/src/prompts/article";
import { streamArticleScene } from "../../blog-ai-worker/src/scenes/article";
import { assemblePageReferences, parsePageOutput, PAGE_REFERENCE_DELIMITER } from "../../blog-ai-worker/src/scenes/page";
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

describe("article scene", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    streamChatMock.mockReset();
  });

  it("尾部 JSON 非法时保留答案并降级为空引用", () => {
    expect(parsePageOutput(`答案正文\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":}`)).toEqual({
      answer: "答案正文",
      sectionIds: [],
    });
  });

  it("流式场景下尾部 JSON 非法时仍保留正文并返回空引用", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "tdd-introduction",
          title: "TDD 入门",
          date: "2026-05-05T00:00:00.000Z",
          excerpt: "从反馈回路理解 TDD。",
          tags: ["TDD"],
          sections: [{ id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" }],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ choices: [{ delta: { content: `答案正文\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":}` } }] })}\n\n`,
          ),
        );
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    streamChatMock.mockResolvedValue(upstream);

    const response = await streamArticleScene(
      {
        scene: "article",
        message: "3 行总结这篇文章",
        context: { slug: "tdd-introduction" },
        cf_turnstile_response: "token",
      },
      env,
    );

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await response.text();
    expect(text).toContain("答案正文");
    expect(text).toContain("event: references");
    expect(text).toContain('"references":[]');
    expect(text).toContain("event: done");
    expect(text).not.toContain("event: error");
  });

  it("流式场景在页面数据失效时返回统一友好错误", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ slug: "tdd-introduction", title: "TDD 入门" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      streamArticleScene(
        {
          scene: "article",
          message: "3 行总结这篇文章",
          context: { slug: "tdd-introduction" },
          cf_turnstile_response: "token",
        },
        env,
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "AI 服务刚刚开小差了，请稍后重试。",
    });
  });

  it("assemblePageReferences 最多保留 3 条引用", () => {
    const references = assemblePageReferences(
      [
        { id: "a", heading: "A", content: "", excerpt: "A", anchorId: "a" },
        { id: "b", heading: "B", content: "", excerpt: "B", anchorId: "b" },
        { id: "c", heading: "C", content: "", excerpt: "C", anchorId: "c" },
        { id: "d", heading: "D", content: "", excerpt: "D", anchorId: "d" },
      ],
      "article-section",
      ["a", "b", "c", "d"],
    );

    expect(references).toHaveLength(3);
  });

  it("prompt 明确要求自然回答并避免模板化来源前缀", () => {
    const prompt = buildArticleSystemPrompt({
      slug: "tdd-introduction",
      title: "TDD 入门",
      date: "2026-05-05T00:00:00.000Z",
      excerpt: "从反馈回路理解 TDD。",
      tags: ["TDD"],
      sections: [{ id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" }],
    });

    expect(prompt).toContain("直接、自然地回答用户问题，不要使用模板化来源前缀");
    expect(prompt).toContain("如需解释依据，可在句中自然表达");
    expect(prompt).toContain("避免使用“页面中显示……”或“当前文章页展示的信息……”这类页面化措辞");
    expect(prompt).toContain("不要写成“文章中提到……”");
    expect(prompt).not.toContain("回答时优先使用“文章中提到……”");
    expect(prompt).toContain("sectionId: intro");
  });
});
