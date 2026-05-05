import { buildRecommendStreamSystemPrompt, RECOMMEND_REFERENCE_DELIMITER } from "../prompts/recommend";
import { createProvider } from "../providers";
import type { ChatRequest } from "../providers/types";
import type { AIUsage, Env, RecommendReference } from "../types";
import { HttpError } from "../types";
import { createAnswerDeltaSanitizer } from "../utils/answer";
import { eventStreamResponse } from "../utils/response";
import { USER_FACING_AI_ERROR_MESSAGE } from "./errors";

const MAX_CONTEXT_POSTS = 8;
const MAX_REFERENCES = 3;
const DEFAULT_FALLBACK_ANSWER = "我暂时没整理出明确推荐，你可以换个更具体的话题再试一次。";
const QUERY_STOPWORDS = ["推荐", "几篇", "关于", "文章", "博客", "一下", "帮我", "想读", "主题", "相关", "内容", "请", "的"];
const RECOMMEND_AI_ERROR_MESSAGE = USER_FACING_AI_ERROR_MESSAGE;

interface AIIndexPayload {
  generated: string;
  posts: RecommendReference[];
}

interface SelectedPostsResult {
  posts: RecommendReference[];
  hasMatch: boolean;
}

interface RecommendTailPayload {
  slugs: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReference(value: unknown): value is RecommendReference {
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

function parseRecommendTailPayload(value: string): RecommendTailPayload {
  const payload: unknown = JSON.parse(value);

  if (!isRecord(payload) || !Array.isArray(payload.slugs) || !payload.slugs.every((slug) => typeof slug === "string")) {
    throw new Error("Invalid recommend reference tail payload");
  }

  return {
    slugs: payload.slugs,
  };
}

function mapReferences(posts: RecommendReference[], slugs: string[]): RecommendReference[] {
  const postMap = new Map(posts.map((post) => [post.slug, post]));

  return slugs
    .map((slug) => postMap.get(slug))
    .filter((post): post is RecommendReference => post !== undefined)
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

function extractTopicKeywords(message: string, stopwords: string[]): string[] {
  const topicMatch =
    message.match(/关于(.+?)(?:相关的)?文章/u) ??
    message.match(/和(.+?)(?:相关的)?文章/u) ??
    message.match(/推荐几篇(.+?)文章/u);

  if (!topicMatch?.[1]) {
    return [];
  }

  return Array.from(
    new Set(
      topicMatch[1]
        .split(/[、，,\/\s]+/u)
        .flatMap((segment) => {
          const keyword = stripStopwords(normalizeText(segment), stopwords);
          if (keyword.length < 2) {
            return [];
          }

          const keywords = [keyword];
          if (/^\p{Script=Han}+$/u.test(keyword) && keyword.length >= 4) {
            keywords.push(keyword.slice(0, 2));
          }

          return keywords;
        }),
    ),
  );
}

function buildQueryKeywords(message: string): string[] {
  const compactStopwords = QUERY_STOPWORDS.map(normalizeText).filter(Boolean);
  const compact = stripStopwords(normalizeText(message), compactStopwords);
  const topicKeywords = extractTopicKeywords(message, compactStopwords);

  const spacedTokens = message
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => stripStopwords(normalizeText(token), compactStopwords))
    .filter((token) => token.length >= 2);

  const rawKeywords = Array.from(new Set([compact, ...topicKeywords, ...spacedTokens].filter((token) => token.length >= 2)));

  return rawKeywords.filter((keyword) => {
    if (keyword.length > 2) {
      return true;
    }

    return !rawKeywords.some((candidate) => candidate !== keyword && candidate.includes(keyword));
  });
}

function scorePost(post: RecommendReference, keywords: string[]): number {
  if (keywords.length === 0) {
    return 0;
  }

  const title = normalizeText(post.title);
  const excerpt = normalizeText(post.excerpt);
  const tags = post.tags.map((tag: string) => normalizeText(tag));

  return keywords.reduce((score, keyword) => {
    let nextScore = score;

    if (tags.some((tag: string) => tag === keyword)) {
      nextScore += 10;
    }

    if (tags.some((tag: string) => tag.includes(keyword) || keyword.includes(tag))) {
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

function selectContextPosts(posts: RecommendReference[], message: string): SelectedPostsResult {
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

function buildFallbackReason(post: RecommendReference): string {
  const normalizedTags = new Set(post.tags.map((tag: string) => normalizeText(tag)));

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

function buildFallbackResponse(message: string, posts: RecommendReference[], hasMatch: boolean): {
  answer: string;
  references: RecommendReference[];
} {
  const references = posts.slice(0, MAX_REFERENCES);

  if (references.length === 0) {
    return {
      answer: DEFAULT_FALLBACK_ANSWER,
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

function createRecommendChatRequest(systemPrompt: string, message: string, stream: boolean): ChatRequest {
  return {
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: message,
      },
    ],
    maxTokens: 800,
    temperature: 0.4,
    stream,
  };
}

function encodeSSEEvent(event: string, payload: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function parseUpstreamEventBlock(block: string): { data: string } | null {
  const lines = block.split(/\r?\n/);
  const dataLines = [];

  for (const line of lines) {
    if (!line.startsWith("data:")) {
      continue;
    }

    dataLines.push(line.slice(5).trimStart());
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    data: dataLines.join("\n"),
  };
}

function extractTextParts(value: unknown): string[] {
  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextParts(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const parts = [];

  if (typeof value.text === "string") {
    parts.push(value.text);
  }

  if (typeof value.content === "string") {
    parts.push(value.content);
  }

  if (Array.isArray(value.content) || isRecord(value.content)) {
    parts.push(...extractTextParts(value.content));
  }

  return parts;
}

function normalizeTextParts(parts: string[]): string {
  return parts.join("");
}

function extractUpstreamDelta(payload: unknown): string {
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    return "";
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice)) {
    return "";
  }

  if (typeof firstChoice.text === "string") {
    return firstChoice.text;
  }

  if (!isRecord(firstChoice.delta)) {
    return "";
  }

  return normalizeTextParts(extractTextParts(firstChoice.delta.content));
}

function toUsage(payload: unknown): AIUsage | undefined {
  if (!isRecord(payload) || !isRecord(payload.usage)) {
    return undefined;
  }

  const promptTokens = typeof payload.usage.prompt_tokens === "number" ? payload.usage.prompt_tokens : undefined;
  const completionTokens = typeof payload.usage.completion_tokens === "number" ? payload.usage.completion_tokens : undefined;
  const totalTokens = typeof payload.usage.total_tokens === "number" ? payload.usage.total_tokens : undefined;

  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) {
    return undefined;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
  };
}

function createRecommendAnswerStreamProcessor(onDelta: (delta: string) => void) {
  let beforeDelimiterBuffer = "";
  let tailBuffer = "";
  let sawDelimiter = false;

  function flushSafePrefix() {
    const safeLength = Math.max(0, beforeDelimiterBuffer.length - (RECOMMEND_REFERENCE_DELIMITER.length - 1));
    if (safeLength <= 0) {
      return;
    }

    const safeText = beforeDelimiterBuffer.slice(0, safeLength);
    beforeDelimiterBuffer = beforeDelimiterBuffer.slice(safeLength);
    if (safeText) {
      onDelta(safeText);
    }
  }

  return {
    push(chunk: string) {
      if (!chunk) {
        return;
      }

      if (sawDelimiter) {
        tailBuffer += chunk;
        return;
      }

      beforeDelimiterBuffer += chunk;
      const delimiterIndex = beforeDelimiterBuffer.indexOf(RECOMMEND_REFERENCE_DELIMITER);

      if (delimiterIndex >= 0) {
        const answerChunk = beforeDelimiterBuffer.slice(0, delimiterIndex);
        if (answerChunk) {
          onDelta(answerChunk);
        }

        tailBuffer += beforeDelimiterBuffer.slice(delimiterIndex + RECOMMEND_REFERENCE_DELIMITER.length);
        beforeDelimiterBuffer = "";
        sawDelimiter = true;
        return;
      }

      flushSafePrefix();
    },
    finish() {
      if (!sawDelimiter && beforeDelimiterBuffer) {
        onDelta(beforeDelimiterBuffer);
        beforeDelimiterBuffer = "";
      }

      return {
        sawDelimiter,
        tail: tailBuffer.trim(),
      };
    },
  };
}

async function fetchIndex(env: Env): Promise<AIIndexPayload> {
  const response = await fetch(`${env.AI_DATA_BASE_URL.replace(/\/$/, "")}/index.json`);

  if (!response.ok) {
    throw new HttpError(502, RECOMMEND_AI_ERROR_MESSAGE);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isIndexPayload(payload)) {
    throw new HttpError(502, RECOMMEND_AI_ERROR_MESSAGE);
  }

  return payload;
}

export async function handleRecommendSceneStream(message: string, env: Env, origin?: string): Promise<Response> {
  const index = await fetchIndex(env);
  const selection = selectContextPosts(index.posts, message);
  const posts = selection.posts;
  const provider = createProvider(env, env.LLM_MODEL_ID);

  if (!provider.streamChat) {
    throw new HttpError(501, "Current AI provider does not support streaming");
  }

  let upstreamStream: ReadableStream<Uint8Array>;

  try {
    upstreamStream = await provider.streamChat(
      createRecommendChatRequest(buildRecommendStreamSystemPrompt(posts), message, true),
    );
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      throw new HttpError(502, RECOMMEND_AI_ERROR_MESSAGE);
    }

    throw error;
  }
  const fallbackReferences = buildFallbackResponse(message, posts, selection.hasMatch).references;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamStream.getReader();
      const decoder = new TextDecoder();
      const sanitizer = createAnswerDeltaSanitizer((delta) => {
        controller.enqueue(encodeSSEEvent("answer-delta", { delta }));
      });
      const processor = createRecommendAnswerStreamProcessor((delta) => {
        sanitizer.push(delta);
      });

      let buffer = "";
      let usage: AIUsage | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const parsed = parseUpstreamEventBlock(block.trim());
            if (!parsed || parsed.data === "[DONE]") {
              continue;
            }

            const payload: unknown = JSON.parse(parsed.data);
            usage = toUsage(payload) ?? usage;
            processor.push(extractUpstreamDelta(payload));
          }

          if (done) {
            break;
          }
        }

        const remainingBlock = buffer.trim();
        if (remainingBlock) {
          const parsed = parseUpstreamEventBlock(remainingBlock);
          if (parsed && parsed.data !== "[DONE]") {
            const payload: unknown = JSON.parse(parsed.data);
            usage = toUsage(payload) ?? usage;
            processor.push(extractUpstreamDelta(payload));
          }
        }

        const result = processor.finish();
        sanitizer.finish();
        let references = fallbackReferences;

        if (result.sawDelimiter) {
          try {
            const slugs = parseRecommendTailPayload(result.tail).slugs;
            const mappedReferences = mapReferences(posts, slugs);
            references = mappedReferences.length > 0 ? mappedReferences : fallbackReferences;
          } catch {
            references = fallbackReferences;
          }
        }

        controller.enqueue(encodeSSEEvent("references", { references }));
        controller.enqueue(encodeSSEEvent("done", { usage }));
        controller.close();
      } catch {
        controller.enqueue(encodeSSEEvent("error", { message: RECOMMEND_AI_ERROR_MESSAGE }));
        controller.close();
      }
    },
  });

  return eventStreamResponse(stream, origin);
}
