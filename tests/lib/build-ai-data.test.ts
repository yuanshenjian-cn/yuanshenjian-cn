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

  it("作者 payload 来自共享单一数据源", () => {
    const payload = buildAuthorPayload();

    expect(payload.slug).toBe("author");
    expect(payload.title).toBe("袁慎建");
    expect(payload.sections.map((section: { id: string }) => section.id)).toEqual([
      "hero",
      "skills",
      "education",
      "experience",
      "projects",
      "extras",
    ]);
  });
});
