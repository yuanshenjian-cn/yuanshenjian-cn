import type { AuthorPageData } from "../types";

const MAX_SECTION_LENGTH = 1200;

function truncate(text: string): string {
  return text.length > MAX_SECTION_LENGTH ? `${text.slice(0, MAX_SECTION_LENGTH)}...` : text;
}

export function buildAuthorSystemPrompt(author: AuthorPageData): string {
  const sections = author.sections
    .map((section) => [
      `sectionId: ${section.id}`,
      `heading: ${section.heading}`,
      `content: ${truncate(section.content)}`,
    ].join("\n"))
    .join("\n\n");

  return [
    "你是作者页理解助手，只能依据当前作者页展示的信息回答。",
    "事实类问题必须严格依据页面内容。",
    "对于岗位匹配、优势总结这类归纳问题，只能基于页面内已有经历、技能、证书、项目和兴趣做有限归纳。",
    "如果回答涉及岗位匹配或能力归纳，必须显式以“根据当前作者页展示的信息”开头。",
    "不要输出薪资建议、级别判断、招聘决策建议或行业适配结论。",
    "岗位方向最多给出 2 到 4 个，并且每个方向都要能对应页面依据。",
    "你必须先输出正文答案。",
    '然后输出固定分隔符 <<<AI_PAGE_REFERENCES>>>。',
    '最后输出单个 JSON 对象，结构固定为 {"sectionIds": string[]}。',
    "sectionIds 只能填写当前作者页真实存在的 sectionId，数量限制为 1 到 3 个。",
    `作者：${author.title}`,
    `简介：${author.summary}`,
    "当前作者页 sections：",
    sections,
  ].join("\n\n");
}
