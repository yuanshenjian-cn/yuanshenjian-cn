import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildAuthorPayload, extractArticleSections } = require("../../scripts/build-ai-data.js");

describe("build-ai-data helpers", () => {
  it("文章没有标题时会退化成 intro section", () => {
    const sections = extractArticleSections("这是一段没有标题的正文。\n\n继续补充说明。");

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      id: "intro",
      anchorId: "intro",
      heading: "前言",
    });
  });

  it("会忽略代码块里的标题并为重复标题生成稳定 anchor", () => {
    const sections = extractArticleSections([
      "导语内容",
      "",
      "## 第一节",
      "正文 A",
      "```ts",
      "## 代码里的假标题",
      "```",
      "## 第一节",
      "正文 B",
    ].join("\n"));

    expect(sections.map((section: { id: string }) => section.id)).toEqual(["intro", "第一节", "第一节-1"]);
  });

  it("作者 payload 生成结构化实体和细粒度 chunks", () => {
    const payload = buildAuthorPayload();
    const heroChunk = payload.chunks.find((chunk: { id: string }) => chunk.id === "hero");
    const educationChunk = payload.chunks.find((chunk: { id: string }) => chunk.id === "education");
    const publicationChunk = payload.chunks.find((chunk: { id: string }) => chunk.id === "extra-著作发表");

    expect(payload.slug).toBe("author");
    expect(payload.title).toBe("袁慎建");
    expect(payload.entities.profile.name).toBe("袁慎建");
    expect(payload.entities.profile).not.toHaveProperty("resumeHref");
    expect(payload.entities.skills.length).toBeGreaterThan(0);
    expect(payload.entities.projects.length).toBeGreaterThan(0);
    expect(payload.chunks.length).toBeGreaterThan(payload.entities.skills.length);
    expect(payload.chunks.map((chunk: { id: string }) => chunk.id)).toContain("project-locammend-智能顾问-研发交付");
    expect(payload.chunks.map((chunk: { id: string }) => chunk.id)).toContain("skill-ai-agent");
    expect(payload.chunks.map((chunk: { id: string }) => chunk.id)).toContain("certificate-csm-2020年");
    expect(payload.chunks.map((chunk: { id: string }) => chunk.id)).toContain("experience-thoughtworks-技术教练-and-咨询顾问");
    expect(payload.chunks.every((chunk: { id: string }) => !chunk.id.includes("---"))).toBe(true);
    expect(payload.sections.find((section: { id: string }) => section.id === "project-locammend-智能顾问-研发交付")?.anchorId).toBe(
      "projects",
    );
    expect(heroChunk?.content).not.toContain("简历 PDF");
    expect(educationChunk?.content).toContain("学校官网：https://www.chd.edu.cn/");
    expect(publicationChunk?.content).toContain("整洁软件设计：https://www.yuque.com/yuanshenjian/agile-software-design");
  });
});
