import type { RecommendReference } from "../types";

export const BRIEFING_RECOMMEND_REFERENCE_DELIMITER = "<<<AI_BRIEFING_RECOMMEND_REFERENCES>>>";

const MAX_PROMPT_BRIEFINGS = 10;
const MAX_EXCERPT_LENGTH = 180;

function truncate(value: string): string {
  return value.length > MAX_EXCERPT_LENGTH ? `${value.slice(0, MAX_EXCERPT_LENGTH)}...` : value;
}

function formatBriefing(briefing: RecommendReference): string {
  const tags = briefing.tags.length > 0 ? briefing.tags.join(", ") : "无";
  return [
    `slug: ${briefing.slug}`,
    `title: ${briefing.title}`,
    `date: ${briefing.date.slice(0, 10)}`,
    `url: ${briefing.url ?? `/ai/daily-briefings/${briefing.slug}`}`,
    `tags: ${tags}`,
    `excerpt: ${truncate(briefing.excerpt)}`,
  ].join("\n");
}

export function buildBriefingRecommendStreamSystemPrompt(briefings: RecommendReference[]): string {
  const context = briefings.slice(0, MAX_PROMPT_BRIEFINGS).map(formatBriefing).join("\n\n---\n\n");

  return [
    "你是博客 AI 每日简报推荐助手。你的任务只是在给定的 AI 每日简报列表中推荐最相关的 1 到 3 期。",
    "不要推荐上下文里不存在的简报，不要编造日期、标题或链接。",
    "优先匹配用户主题、厂商名、时间范围和摘要。",
    "先用中文自然语言直接回答，简洁说明推荐理由。",
    `回答正文结束后，必须紧跟固定分隔符 ${BRIEFING_RECOMMEND_REFERENCE_DELIMITER}。`,
    '分隔符后只输出 JSON，不要使用 Markdown 代码块，也不要再追加其他说明。',
    'JSON 结构固定为：{"slugs": string[] }。',
    "可推荐的 AI 每日简报：",
    context || "当前时间范围内没有可推荐的 AI 每日简报。",
  ].join("\n\n");
}
