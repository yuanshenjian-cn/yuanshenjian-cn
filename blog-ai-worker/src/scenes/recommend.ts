import { buildRecommendSystemPrompt } from "../prompts/recommend";
import { createProvider } from "../providers";
import type { ChatResponse } from "../providers/types";
import type { AIChatResponse, AIReference, Env } from "../types";
import { HttpError } from "../types";

const RECOMMEND_MODEL = "glm-5.1";
const MAX_CONTEXT_POSTS = 8;
const MAX_REFERENCES = 3;
const DEFAULT_ANSWER = "我暂时没整理出明确推荐，你可以换个更具体的话题再试一次。";
const QUERY_STOPWORDS = ["推荐", "几篇", "关于", "文章", "博客", "一下", "帮我", "想读", "主题", "相关", "内容", "请", "的"];

interface AIIndexPayload {
  generated: string;
  posts: AIReference[];
}

interface RecommendModelPayload {
  answer: string;
  slugs: string[];
}

interface SelectedPostsResult {
  posts: AIReference[];
  hasMatch: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReference(value: unknown): value is AIReference {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    typeof value.date === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

function isIndexPayload(value: unknown): value is AIIndexPayload {
  return (
    isRecord(value) &&
    typeof value.generated === "string" &&
    Array.isArray(value.posts) &&
    value.posts.every(isReference)
  );
}

function extractJson(content: string): string {
  const fencedMatch = content.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const objectStart = content.indexOf("{");
  const objectEnd = content.lastIndexOf("}");

  if (objectStart >= 0 && objectEnd > objectStart) {
    return content.slice(objectStart, objectEnd + 1);
  }

  return content;
}

function parseModelResponse(content: string): RecommendModelPayload {
  const rawJson = extractJson(content);

  try {
    const payload: unknown = JSON.parse(rawJson);
    if (
      isRecord(payload) &&
      typeof payload.answer === "string" &&
      Array.isArray(payload.slugs) &&
      payload.slugs.every((slug) => typeof slug === "string")
    ) {
      return {
        answer: payload.answer.trim() || DEFAULT_ANSWER,
        slugs: payload.slugs,
      };
    }
  } catch {
    // 让下方回退到纯文本 answer，避免把偶发的模型格式问题暴露为 500。
  }

  return {
    answer: content.trim() || DEFAULT_ANSWER,
    slugs: [],
  };
}

function mapReferences(posts: AIReference[], slugs: string[]): AIReference[] {
  const postMap = new Map(posts.map((post) => [post.slug, post]));

  return slugs
    .map((slug) => postMap.get(slug))
    .filter((post): post is AIReference => post !== undefined)
    .slice(0, MAX_REFERENCES);
}

function normalizeText(input: string): string {
  return input.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").trim();
}

function stripStopwords(input: string, stopwords: string[]): string {
  let result = input;

  for (const stopword of stopwords) {
    result = result.replaceAll(stopword, "");
  }

  return result;
}

function buildQueryKeywords(message: string): string[] {
  const compactStopwords = QUERY_STOPWORDS.map(normalizeText).filter(Boolean);
  const compact = stripStopwords(normalizeText(message), compactStopwords);

  const spacedTokens = message
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => stripStopwords(normalizeText(token), compactStopwords))
    .filter((token) => token.length >= 2);

  const rawKeywords = Array.from(new Set([compact, ...spacedTokens].filter((token) => token.length >= 2)));

  return rawKeywords.filter((keyword) => {
    if (keyword.length > 2) {
      return true;
    }

    return !rawKeywords.some((candidate) => candidate !== keyword && candidate.includes(keyword));
  });
}

function scorePost(post: AIReference, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }

  const title = normalizeText(post.title);
  const excerpt = normalizeText(post.excerpt);
  const tags = post.tags.map((tag) => normalizeText(tag));

  return keywords.reduce((score, keyword) => {
    let nextScore = score;

    if (tags.some((tag) => tag === keyword)) {
      nextScore += 10;
    }

    if (tags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) {
      nextScore += 4;
    }

    if (title.includes(keyword)) {
      nextScore += 5;
    }

    if (excerpt.includes(keyword)) {
      nextScore += 2;
    }

    return nextScore;
  }, 0);
}

function selectContextPosts(posts: AIReference[], message: string): SelectedPostsResult {
  const keywords = buildQueryKeywords(message);

  const rankedPosts = posts
    .map((post, index) => ({
      post,
      index,
      score: scorePost(post, keywords),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.index - right.index;
    });

  const matchedPosts = rankedPosts.filter((item) => item.score > 0).map((item) => item.post);
  if (matchedPosts.length > 0) {
    return {
      posts: matchedPosts.slice(0, MAX_CONTEXT_POSTS),
      hasMatch: true,
    };
  }

  return {
    posts: posts.slice(0, MAX_CONTEXT_POSTS),
    hasMatch: false,
  };
}

function buildFallbackReason(post: AIReference): string {
  const normalizedTags = new Set(post.tags.map((tag) => normalizeText(tag)));

  if (normalizedTags.has(normalizeText("选型指南"))) {
    return "适合先快速建立整体选型视角。";
  }

  if (normalizedTags.has(normalizeText("ClaudeCode"))) {
    return "适合继续深入 Claude Code 的配置和工作流。";
  }

  if (normalizedTags.has(normalizeText("OpenCode"))) {
    return "适合了解 OpenCode 的具体用法和进阶实践。";
  }

  if (normalizedTags.has(normalizeText("Codex"))) {
    return "适合补上 Codex 的配置思路和使用心智。";
  }

  if (normalizedTags.has(normalizeText("AI 编程"))) {
    return "和 AI 编程主题直接相关。";
  }

  if (normalizedTags.has(normalizeText("TDD"))) {
    return "如果你想继续收窄到测试驱动开发，这是更聚焦的一篇。";
  }

  return "和你这次想读的主题比较接近。";
}

function buildFallbackResponse(message: string, posts: AIReference[], hasMatch: boolean): AIChatResponse {
  const references = posts.slice(0, MAX_REFERENCES);

  if (references.length === 0) {
    return {
      answer: DEFAULT_ANSWER,
      references: [],
    };
  }

  const answer = hasMatch
    ? `我先按“${message}”这个主题，基于站内已发布文章给你做一版稳定推荐：${references
        .map((reference) => `《${reference.title}》${buildFallbackReason(reference)}`)
        .join(" ")}`
    : `我先给你推荐几篇站内较新的相关文章：${references.map((reference) => `《${reference.title}》`).join("、")}。如果你愿意，也可以把主题再说得更具体一点。`;

  return {
    answer,
    references,
  };
}

async function getRecommendResponse(message: string, provider: ReturnType<typeof createProvider>, posts: AIReference[]): Promise<ChatResponse> {
  return provider.chat({
    messages: [
      {
        role: "system",
        content: buildRecommendSystemPrompt(posts),
      },
      {
        role: "user",
        content: message,
      },
    ],
    maxTokens: 800,
    temperature: 0.4,
    stream: false,
  });
}

async function fetchIndex(env: Env): Promise<AIIndexPayload> {
  const response = await fetch(`${env.AI_DATA_BASE_URL.replace(/\/$/, "")}/index.json`);

  if (!response.ok) {
    throw new HttpError(502, "Failed to load AI index data");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isIndexPayload(payload)) {
    throw new HttpError(502, "AI index payload is invalid");
  }

  return payload;
}

export async function handleRecommendScene(message: string, env: Env): Promise<AIChatResponse> {
  const index = await fetchIndex(env);
  const selection = selectContextPosts(index.posts, message);
  const posts = selection.posts;
  const provider = createProvider(env, RECOMMEND_MODEL);
  let llmResponse: ChatResponse;

  try {
    llmResponse = await getRecommendResponse(message, provider, posts);
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      return buildFallbackResponse(message, posts, selection.hasMatch);
    }

    throw error;
  }

  const modelResponse = parseModelResponse(llmResponse.content);
  const references = mapReferences(posts, modelResponse.slugs);

  return {
    answer: modelResponse.answer,
    references: references.length > 0 ? references : buildFallbackResponse(message, posts, selection.hasMatch).references,
    usage: llmResponse.usage,
  };
}
