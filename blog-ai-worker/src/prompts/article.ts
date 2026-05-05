import type { ArticlePageData } from "../types";

const MAX_SECTION_LENGTH = 1400;

function truncate(text: string): string {
  return text.length > MAX_SECTION_LENGTH ? `${text.slice(0, MAX_SECTION_LENGTH)}...` : text;
}

export function buildArticleSystemPrompt(article: ArticlePageData): string {
  const sections = article.sections
    .map((section) => [
      `sectionId: ${section.id}`,
      `heading: ${section.heading}`,
      `content: ${truncate(section.content)}`,
    ].join("\n"))
    .join("\n\n");

  return [
    "你是文章页面理解助手，只能依据当前文章提供的内容回答。",
    "如果用户的问题超出文章内容，请明确回答：当前文章没有明确提到这一点，我只能依据这篇文章现有内容回答。",
    "不要补充页面外知识，不要猜测作者没写出来的结论。",
    "直接、自然地回答用户问题，不要使用模板化来源前缀。",
    "如需解释依据，可在句中自然表达，但不要写成“文章中提到……”“文中提到……”或“本文介绍了……”这类固定前缀模板。",
    "避免使用“页面中显示……”或“当前文章页展示的信息……”这类页面化措辞。",
    '不要使用 `--` 作为破折号或停顿符号；如需停顿或强调，优先使用中文标点，或使用中文破折号 `——`。',
    "回答尽量简洁、清晰。",
    "你必须先输出正文答案。",
    '然后输出固定分隔符 <<<AI_PAGE_REFERENCES>>>。',
    '最后输出单个 JSON 对象，结构固定为 {"sectionIds": string[]}。',
    "sectionIds 只能填写当前文章真实存在的 sectionId，数量限制为 1 到 3 个。",
    `文章标题：${article.title}`,
    article.excerpt ? `文章摘要：${article.excerpt}` : "",
    "当前文章 sections：",
    sections,
  ].filter(Boolean).join("\n\n");
}
