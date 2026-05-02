import { buildRecommendSystemPrompt } from "../prompts/recommend";
import { createProvider } from "../providers";
import type { AIChatResponse, AIReference, Env } from "../types";
import { HttpError } from "../types";

const RECOMMEND_MODEL = "glm-5.1";
const MAX_CONTEXT_POSTS = 50;
const MAX_REFERENCES = 3;
const DEFAULT_ANSWER = "我暂时没整理出明确推荐，你可以换个更具体的话题再试一次。";

interface AIIndexPayload {
  generated: string;
  posts: AIReference[];
}

interface RecommendModelPayload {
  answer: string;
  slugs: string[];
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
  const posts = index.posts.slice(0, MAX_CONTEXT_POSTS);
  const provider = createProvider(env, RECOMMEND_MODEL);
  const llmResponse = await provider.chat({
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
    maxTokens: 400,
    temperature: 0.4,
    stream: false,
  });

  const modelResponse = parseModelResponse(llmResponse.content);

  return {
    answer: modelResponse.answer,
    references: mapReferences(posts, modelResponse.slugs),
    usage: llmResponse.usage,
  };
}
