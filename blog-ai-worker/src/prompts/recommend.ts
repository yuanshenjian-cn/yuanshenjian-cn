import type { RecommendReference } from "../types";

const MAX_PROMPT_POSTS = 50;
const MAX_EXCERPT_LENGTH = 160;
export const RECOMMEND_REFERENCE_DELIMITER = "<<<AI_RECOMMEND_REFERENCES>>>";

function truncate(text: string): string {
  return text.length > MAX_EXCERPT_LENGTH ? `${text.slice(0, MAX_EXCERPT_LENGTH)}...` : text;
}

function formatPost(post: RecommendReference): string {
  const tags = post.tags.length > 0 ? post.tags.join(", ") : "无";
  return [
    `slug: ${post.slug}`,
    `title: ${post.title}`,
    `date: ${post.date.slice(0, 10)}`,
    `tags: ${tags}`,
    `excerpt: ${truncate(post.excerpt)}`,
  ].join("\n");
}

function buildRecommendPrompt(posts: RecommendReference[], outputInstructions: string[]): string {
  const postList = posts.slice(0, MAX_PROMPT_POSTS).map(formatPost).join("\n\n");

  return [
    "你是个人博客文章推荐助手，只能基于给定的文章列表回答。",
    "如果用户的问题超出列表内容，请直接说明你不知道，不要编造站外信息。",
    '不要使用 `--` 作为破折号或停顿符号；如需停顿或强调，优先使用中文标点，或使用中文破折号 `——`。',
    ...outputInstructions,
    "slugs 里只能填写列表中真实存在的 slug；如果没有合适文章，请返回空数组。",
    "以下是当前可推荐的文章列表：",
    postList,
  ].join("\n\n");
}

export function buildRecommendSystemPrompt(posts: RecommendReference[]): string {
  return buildRecommendPrompt(posts, [
    "请优先推荐最相关的 1 到 3 篇文章，并给出简短理由。",
    "你的输出必须是 JSON 对象，不要使用 Markdown 代码块。",
    'JSON 结构固定为：{"answer": string, "slugs": string[] }。',
  ]);
}

export function buildRecommendStreamSystemPrompt(posts: RecommendReference[]): string {
  return buildRecommendPrompt(posts, [
    "先用自然语言直接回答，给出 1 到 3 篇文章的推荐理由。",
    `回答正文结束后，必须紧跟固定分隔符 ${RECOMMEND_REFERENCE_DELIMITER}。`,
    '分隔符后只输出 JSON，不要使用 Markdown 代码块，也不要再追加其他说明。',
    'JSON 结构固定为：{"slugs": string[] }。',
  ]);
}
