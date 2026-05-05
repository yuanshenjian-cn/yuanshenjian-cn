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

import { buildAuthorSystemPrompt } from "../../blog-ai-worker/src/prompts/author";
import { streamAuthorScene } from "../../blog-ai-worker/src/scenes/author";
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

describe("author scene", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    streamChatMock.mockReset();
  });

  it("缺少 chunks 时会回退到 legacy sections", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          slug: "author",
          title: "袁慎建",
          summary: "AI 效率工程师 | 研发效能专家 | 敏捷开发教练",
          entities: {
            profile: { id: "hero", heading: "个人简介", name: "袁慎建", roles: [], phone: "", email: "", summary: [] },
            skills: [],
            certificates: [],
            education: { id: "education", heading: "教育背景", school: "学校", major: "专业", period: "时间" },
            experiences: [],
            projects: [],
            extras: [],
          },
          chunks: [],
          sections: [{ id: "experience", heading: "经历概览", content: "经历内容", excerpt: "经历摘录", anchorId: "experience" }],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    const upstream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"choices":[{"delta":{"content":"他有相关交付经验。<<<AI_PAGE_REFERENCES>>>{\\"sectionIds\\":[\\"experience\\"]}"}}]}\n\n',
          ),
        );
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    streamChatMock.mockResolvedValue(upstream);

    const response = await streamAuthorScene(
      {
        scene: "author",
        message: "作者更适合什么岗位",
        context: { page: "author" },
        cf_turnstile_response: "token",
      },
      env,
    );

    const text = await response.text();
    expect(text).toContain('"id":"experience"');
    expect(text).toContain('"title":"经历概览"');
  });

  it("流式场景在作者页数据失效时返回统一友好错误", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ slug: "author", title: "袁慎建" }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      streamAuthorScene(
        {
          scene: "author",
          message: "作者更适合什么岗位",
          context: { page: "author" },
          cf_turnstile_response: "token",
        },
        env,
      ),
    ).rejects.toMatchObject({
      status: 502,
      message: "AI 服务刚刚开小差了，请稍后重试。",
    });
  });

  it("prompt 明确要求自然回答并避免模板化来源前缀", () => {
    const prompt = buildAuthorSystemPrompt({
      slug: "author",
      title: "袁慎建",
      summary: "AI 效率工程师 | 研发效能专家 | 敏捷开发教练",
      entities: {
        profile: { id: "hero", heading: "个人简介", name: "袁慎建", roles: [], phone: "", email: "", summary: [] },
        skills: [],
        certificates: [],
        education: { id: "education", heading: "教育背景", school: "学校", major: "专业", period: "时间" },
        experiences: [],
        projects: [],
        extras: [],
      },
      chunks: [{ id: "hero", heading: "个人简介", content: "内容", excerpt: "摘录", anchorId: "hero" }],
    });

    expect(prompt).toContain("直接、自然地回答用户问题，不要使用模板化来源前缀");
    expect(prompt).toContain("如需解释依据，可在句中自然说明");
    expect(prompt).toContain("避免使用“页面中显示……”或“根据当前作者页展示的信息……”这类页面化措辞");
    expect(prompt).toContain("不要写成“作者技能中提到……”");
    expect(prompt).not.toContain("优先使用更贴近结构化信息来源的措辞");
    expect(prompt).not.toContain("必须显式以“根据当前作者页展示的信息”开头");
    expect(prompt).toContain("不要输出薪资建议、级别判断、招聘决策建议或行业适配结论");
    expect(prompt).toContain("sectionId: hero");
  });
});
