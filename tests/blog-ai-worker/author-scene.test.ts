import { afterEach, describe, expect, it, vi } from "vitest";

const { chatMock } = vi.hoisted(() => ({
  chatMock: vi.fn(),
}));

vi.mock("../../blog-ai-worker/src/providers/index", () => ({
  createProvider: () => ({
    name: "mock-provider",
    chat: chatMock,
  }),
}));

import { buildAuthorSystemPrompt } from "../../blog-ai-worker/src/prompts/author";
import { handleAuthorScene } from "../../blog-ai-worker/src/scenes/author";
import { PAGE_REFERENCE_DELIMITER } from "../../blog-ai-worker/src/scenes/page";
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
    chatMock.mockReset();
  });

  it("根据 sectionIds 组装作者页引用", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          slug: "author",
          title: "袁慎建",
          summary: "AI 软件工程师 | 研发效能专家 | 敏捷开发教练",
          entities: {
            profile: { id: "hero", heading: "个人简介", name: "袁慎建", roles: [], phone: "", email: "", summary: [] },
            skills: [],
            certificates: [],
            education: { id: "education", heading: "教育背景", school: "学校", major: "专业", period: "时间" },
            experiences: [],
            projects: [],
            extras: [],
          },
          chunks: [
            { id: "experience-thoughtworks", heading: "经历｜Thoughtworks", content: "经历内容", excerpt: "经历摘录", anchorId: "experience" },
            { id: "skill-ai-agent", heading: "技能｜AI Agent", content: "技能内容", excerpt: "技能摘录", anchorId: "skills" },
          ],
          sections: [
            { id: "experience", heading: "旧经历概览", content: "旧经历内容", excerpt: "旧经历摘录", anchorId: "experience" },
            { id: "skills", heading: "旧技能证书", content: "旧技能内容", excerpt: "旧技能摘录", anchorId: "skills" },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    chatMock.mockResolvedValue({
      content: `根据当前作者页展示的信息，我倾向判断他更适合技术负责人和研发效能方向。\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":["experience-thoughtworks","skill-ai-agent"]}`,
    });

    const result = await handleAuthorScene(
      {
        scene: "author",
        message: "作者更适合什么岗位",
        context: { page: "author" },
        cf_turnstile_response: "token",
      },
      env,
    );

    expect(result.answer).toContain("根据当前作者页展示的信息");
    expect(result.references).toEqual([
      {
        id: "experience-thoughtworks",
        title: "经历｜Thoughtworks",
        excerpt: "经历摘录",
        sourceType: "author-section",
        anchorId: "experience",
      },
      {
        id: "skill-ai-agent",
        title: "技能｜AI Agent",
        excerpt: "技能摘录",
        sourceType: "author-section",
        anchorId: "skills",
      },
    ]);
  });

  it("缺少 chunks 时会回退到 legacy sections", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          slug: "author",
          title: "袁慎建",
          summary: "AI 软件工程师 | 研发效能专家 | 敏捷开发教练",
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
          sections: [
            { id: "experience", heading: "经历概览", content: "经历内容", excerpt: "经历摘录", anchorId: "experience" },
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );

    chatMock.mockResolvedValue({
      content: `根据当前作者页展示的信息，我倾向判断他更适合技术负责人方向。\n${PAGE_REFERENCE_DELIMITER}\n{"sectionIds":["experience"]}`,
    });

    const result = await handleAuthorScene(
      {
        scene: "author",
        message: "作者更适合什么岗位",
        context: { page: "author" },
        cf_turnstile_response: "token",
      },
      env,
    );

    expect(result.references).toEqual([
      {
        id: "experience",
        title: "经历概览",
        excerpt: "经历摘录",
        sourceType: "author-section",
        anchorId: "experience",
      },
    ]);
  });

  it("prompt 明确要求岗位归纳使用谨慎表述", () => {
    const prompt = buildAuthorSystemPrompt({
      slug: "author",
      title: "袁慎建",
      summary: "AI 软件工程师 | 研发效能专家 | 敏捷开发教练",
      entities: {
        profile: { id: "hero", heading: "个人简介", name: "袁慎建", roles: [], phone: "", email: "", summary: [] },
        skills: [],
        certificates: [],
        education: { id: "education", heading: "教育背景", school: "学校", major: "专业", period: "时间" },
        experiences: [],
        projects: [],
        extras: [],
      },
      chunks: [
        { id: "hero", heading: "个人简介", content: "内容", excerpt: "摘录", anchorId: "hero" },
      ],
    });

    expect(prompt).toContain("根据当前作者页展示的信息");
    expect(prompt).toContain("不要输出薪资建议、级别判断、招聘决策建议或行业适配结论");
    expect(prompt).toContain("sectionId: hero");
  });
});
