import { afterEach, describe, expect, it, vi } from "vitest";

const { chatMock, streamChatMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
  streamChatMock: vi.fn(),
}));

vi.mock("../../blog-ai-worker/src/providers/index", () => ({
  createProvider: () => ({
    name: "mock-provider",
    chat: chatMock,
    streamChat: streamChatMock,
  }),
}));

import { handleArticleScene, streamArticleScene } from "../../blog-ai-worker/src/scenes/article";
import { assemblePageReferences, parsePageOutput, PAGE_REFERENCE_DELIMITER } from "../../blog-ai-worker/src/scenes/page";
import type { Env } from "../../blog-ai-worker/src/types";

const env: Env = {
  RATE_LIMIT_KV: {
    get: vi.fn(),
    put: vi.fn(),
  },
  LLM_ACTIVE_PROFILE: "tencent-tokenhub/glm-5.1",
  LLM_PROVIDER_NAME: "tencent-tokenhub",
  LLM_MODEL_ID: "glm-5.1",
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
    chatMock.mockReset();
    streamChatMock.mockReset();
  });

  it("根据 sectionIds 组装真实引用，并过滤无效和重复 id", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          slug: "tdd-introduction",
          title: "TDD 入门",
          date: "2026-05-05T00:00:00.000Z",
          excerpt: "从反馈回路理解 TDD。",
          tags: ["TDD"],
          sections: [
            { id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" },
            { id: "loop", heading: "反馈回路", content: "反馈回路内容", excerpt: "反馈回路摘录", anchorId: "loop" },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    chatMock.mockResolvedValue({
      content: `答案正文\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":["intro","missing","intro","loop"]}`,
    });

    const result = await handleArticleScene(
      {
        scene: "article",
        message: "3 行总结这篇文章",
        context: { slug: "tdd-introduction" },
        cf_turnstile_response: "token",
      },
      env,
    );

    expect(result.answer).toBe("答案正文");
    expect(result.references).toEqual([
      {
        id: "intro",
        title: "前言",
        excerpt: "前言摘录",
        sourceType: "article-section",
        anchorId: "intro",
      },
      {
        id: "loop",
        title: "反馈回路",
        excerpt: "反馈回路摘录",
        sourceType: "article-section",
        anchorId: "loop",
      },
    ]);
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
          sections: [
            { id: "intro", heading: "前言", content: "前言内容", excerpt: "前言摘录", anchorId: "intro" },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: `答案正文\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":}` } }] })}\n\n`));
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
});
