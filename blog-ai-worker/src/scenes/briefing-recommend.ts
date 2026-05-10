import { createProvider } from "../providers";
import type { ChatRequest } from "../providers/types";
import type { AIUsage, Env, RecommendReference } from "../types";
import { HttpError } from "../types";
import { buildBriefingRecommendStreamSystemPrompt, BRIEFING_RECOMMEND_REFERENCE_DELIMITER } from "../prompts/briefing-recommend";
import { createAnswerDeltaSanitizer } from "../utils/answer";
import { eventStreamResponse } from "../utils/response";

const BRIEFING_RECOMMEND_AI_ERROR_MESSAGE = "AI 服务刚刚开小差了，请稍后重试。";
const MAX_CONTEXT_BRIEFINGS = 10;
const MAX_REFERENCES = 3;
const QUERY_STOPWORDS = ["请", "推荐", "简报", "动态", "内容", "关于", "一下", "最近", "今天", "本周"];

interface BriefingIndexPayload {
  generated: string;
  briefings: RecommendReference[];
}

interface BriefingRecommendTailPayload {
  slugs: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isReference(value: unknown): value is RecommendReference {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    typeof value.date === "string" &&
    (value.url === undefined || typeof value.url === "string") &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

function isIndexPayload(value: unknown): value is BriefingIndexPayload {
  return isRecord(value) && typeof value.generated === "string" && Array.isArray(value.briefings) && value.briefings.every(isReference);
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

function buildQueryKeywords(message: string): string[] {
  const compactStopwords = QUERY_STOPWORDS.map(normalizeText);
  const compact = compactStopwords.reduce((value, stopword) => value.replaceAll(stopword, ""), normalizeText(message));
  const tokens = message
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((token) => normalizeText(token))
    .filter((token) => token.length >= 2 && !compactStopwords.includes(token));

  return Array.from(new Set([compact, ...tokens].filter((token) => token.length >= 2)));
}

function isInRange(date: string, range: "today" | "3d" | "7d" | "14d" | "30d"): boolean {
  const days = range === "today" ? 1 : Number.parseInt(range.replace("d", ""), 10);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return new Date(date).getTime() >= start.getTime();
}

function scoreBriefing(briefing: RecommendReference, keywords: string[]): number {
  const title = normalizeText(briefing.title);
  const excerpt = normalizeText(briefing.excerpt);
  const tags = briefing.tags.map(normalizeText);

  return keywords.reduce((score, keyword) => {
    let nextScore = score;
    if (tags.some((tag) => tag === keyword)) nextScore += 10;
    if (title.includes(keyword)) nextScore += 5;
    if (tags.some((tag) => tag.includes(keyword) || keyword.includes(tag))) nextScore += 4;
    if (excerpt.includes(keyword)) nextScore += 2;
    return nextScore;
  }, 0);
}

function selectContextBriefings(briefings: RecommendReference[], message: string): RecommendReference[] {
  const keywords = buildQueryKeywords(message);
  if (keywords.length === 0) {
    return briefings.slice(0, MAX_CONTEXT_BRIEFINGS);
  }

  const ranked = briefings
    .map((briefing, index) => ({ briefing, index, score: scoreBriefing(briefing, keywords) }))
    .sort((left, right) => (right.score !== left.score ? right.score - left.score : left.index - right.index));
  const matched = ranked.filter((item) => item.score > 0).map((item) => item.briefing);

  return (matched.length > 0 ? matched : briefings).slice(0, MAX_CONTEXT_BRIEFINGS);
}

function parseTailPayload(value: string): BriefingRecommendTailPayload {
  const payload: unknown = JSON.parse(value);

  if (!isRecord(payload) || !Array.isArray(payload.slugs) || !payload.slugs.every((slug) => typeof slug === "string")) {
    throw new Error("Invalid briefing recommend tail payload");
  }

  return { slugs: payload.slugs };
}

function mapReferences(briefings: RecommendReference[], slugs: string[]): RecommendReference[] {
  const briefingMap = new Map(briefings.map((briefing) => [briefing.slug, briefing]));

  return slugs
    .map((slug) => briefingMap.get(slug))
    .filter((briefing): briefing is RecommendReference => briefing !== undefined)
    .slice(0, MAX_REFERENCES);
}

function createChatRequest(systemPrompt: string, message: string): ChatRequest {
  return {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    maxTokens: 700,
    temperature: 0.3,
    stream: true,
  };
}

function parseUpstreamEventBlock(block: string): { data: string } | null {
  const lines = block.split(/\r?\n/).map((line) => line.trimEnd());
  const dataLines = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart());

  return dataLines.length > 0 ? { data: dataLines.join("\n") } : null;
}

function extractUpstreamDelta(payload: unknown): string {
  if (!isRecord(payload)) return "";
  const choices = payload.choices;
  if (!Array.isArray(choices)) return "";
  return choices
    .flatMap((choice) => {
      if (!isRecord(choice) || !isRecord(choice.delta) || typeof choice.delta.content !== "string") {
        return [];
      }
      return [choice.delta.content];
    })
    .join("");
}

function toUsage(payload: unknown): AIUsage | undefined {
  if (!isRecord(payload) || !isRecord(payload.usage)) return undefined;
  return {
    promptTokens: typeof payload.usage.prompt_tokens === "number" ? payload.usage.prompt_tokens : undefined,
    completionTokens: typeof payload.usage.completion_tokens === "number" ? payload.usage.completion_tokens : undefined,
    totalTokens: typeof payload.usage.total_tokens === "number" ? payload.usage.total_tokens : undefined,
  };
}

function encodeSSEEvent(event: string, payload: unknown): Uint8Array {
  return new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

async function fetchIndex(env: Env): Promise<BriefingIndexPayload> {
  const response = await fetch(`${env.AI_DATA_BASE_URL.replace(/\/$/, "")}/briefings/index.json`);

  if (!response.ok) {
    throw new HttpError(502, BRIEFING_RECOMMEND_AI_ERROR_MESSAGE);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!isIndexPayload(payload)) {
    throw new HttpError(502, BRIEFING_RECOMMEND_AI_ERROR_MESSAGE);
  }

  return payload;
}

export async function handleBriefingRecommendSceneStream(
  message: string,
  range: "today" | "3d" | "7d" | "14d" | "30d",
  env: Env,
  origin?: string,
): Promise<Response> {
  const index = await fetchIndex(env);
  const rangedBriefings = index.briefings.filter((briefing) => isInRange(briefing.date, range));
  const briefings = selectContextBriefings(rangedBriefings, message);
  const provider = createProvider(env, env.LLM_MODEL_ID);

  if (!provider.streamChat) {
    throw new HttpError(501, "Current AI provider does not support streaming");
  }

  let upstreamStream: ReadableStream<Uint8Array>;

  try {
    upstreamStream = await provider.streamChat(createChatRequest(buildBriefingRecommendStreamSystemPrompt(briefings), message));
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      throw new HttpError(502, BRIEFING_RECOMMEND_AI_ERROR_MESSAGE);
    }
    throw error;
  }

  const fallbackReferences = briefings.slice(0, MAX_REFERENCES);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamStream.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let usage: AIUsage | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
          const blocks = buffer.split(/\r?\n\r?\n/);
          buffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const parsed = parseUpstreamEventBlock(block.trim());
            if (!parsed || parsed.data === "[DONE]") continue;
            const payload: unknown = JSON.parse(parsed.data);
            usage = toUsage(payload) ?? usage;
            fullText += extractUpstreamDelta(payload);
          }

          if (done) break;
        }

        const delimiterIndex = fullText.indexOf(BRIEFING_RECOMMEND_REFERENCE_DELIMITER);
        const answer = delimiterIndex >= 0 ? fullText.slice(0, delimiterIndex) : fullText;
        const tail = delimiterIndex >= 0 ? fullText.slice(delimiterIndex + BRIEFING_RECOMMEND_REFERENCE_DELIMITER.length) : "";
        let references = fallbackReferences;

        if (tail.trim()) {
          try {
            const mappedReferences = mapReferences(briefings, parseTailPayload(tail.trim()).slugs);
            references = mappedReferences.length > 0 ? mappedReferences : fallbackReferences;
          } catch {
            references = fallbackReferences;
          }
        }

        const sanitizer = createAnswerDeltaSanitizer((delta) => controller.enqueue(encodeSSEEvent("answer-delta", { delta })));
        sanitizer.push(answer || "这个时间范围内没有找到足够相关的 AI 每日简报。");
        sanitizer.finish();
        controller.enqueue(encodeSSEEvent("references", { references }));
        controller.enqueue(encodeSSEEvent("done", { usage }));
        controller.close();
      } catch {
        controller.enqueue(encodeSSEEvent("error", { message: BRIEFING_RECOMMEND_AI_ERROR_MESSAGE }));
        controller.close();
      }
    },
  });

  return eventStreamResponse(stream, origin);
}
