import { HttpError } from "../types";
import type { ChatRequest, ChatResponse, LLMProvider } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeTextParts(parts: string[]): string | null {
  const text = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return text || null;
}

function extractTextParts(value: unknown): string[] {
  if (typeof value === "string") {
    return value.trim() ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractTextParts(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const textCandidates: string[] = [];

  if (typeof value.text === "string") {
    textCandidates.push(value.text);
  }

  if (typeof value.content === "string") {
    textCandidates.push(value.content);
  }

  if (typeof value.output_text === "string") {
    textCandidates.push(value.output_text);
  }

  if (typeof value.outputText === "string") {
    textCandidates.push(value.outputText);
  }

  if (Array.isArray(value.content) || isRecord(value.content)) {
    textCandidates.push(...extractTextParts(value.content));
  }

  if (Array.isArray(value.parts) || isRecord(value.parts)) {
    textCandidates.push(...extractTextParts(value.parts));
  }

  if (Array.isArray(value.items) || isRecord(value.items)) {
    textCandidates.push(...extractTextParts(value.items));
  }

  return textCandidates;
}

function getProviderErrorMessage(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return null;
}

function getContent(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  if (typeof payload.output_text === "string") {
    return payload.output_text.trim() || null;
  }

  const outputText = normalizeTextParts(extractTextParts(payload.output));
  if (outputText) {
    return outputText;
  }

  if (!Array.isArray(payload.choices)) {
    return null;
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice)) {
    return null;
  }

  if (typeof firstChoice.text === "string") {
    return firstChoice.text.trim() || null;
  }

  if (!isRecord(firstChoice.message)) {
    return null;
  }

  return normalizeTextParts(extractTextParts(firstChoice.message.content));
}

function getUsage(payload: unknown): ChatResponse["usage"] {
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

function createRequestInit(apiKey: string, baseUrl: string, model: string, request: ChatRequest): RequestInit {
  return {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: request.messages,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      stream: request.stream,
      stream_options: request.stream ? { include_usage: true } : undefined,
    }),
  };
}

export class OpenAICompatibleProvider implements LLMProvider {
  constructor(
    public readonly name: string,
    private readonly displayName: string,
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      createRequestInit(this.apiKey, this.baseUrl, this.model, request),
    );

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new HttpError(502, getProviderErrorMessage(payload) ?? `${this.displayName} request failed`);
    }

    const content = getContent(payload);
    if (!content) {
      throw new HttpError(502, `${this.displayName} returned empty content`);
    }

    return {
      content,
      usage: getUsage(payload),
    };
  }

  async streamChat(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(
      `${this.baseUrl.replace(/\/$/, "")}/chat/completions`,
      createRequestInit(this.apiKey, this.baseUrl, this.model, {
        ...request,
        stream: true,
      }),
    );

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      throw new HttpError(502, getProviderErrorMessage(payload) ?? `${this.displayName} request failed`);
    }

    if (!response.body) {
      throw new HttpError(502, `${this.displayName} returned no stream body`);
    }

    return response.body;
  }
}
