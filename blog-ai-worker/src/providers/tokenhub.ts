import { HttpError } from "../types";
import type { ChatRequest, ChatResponse, LLMProvider } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
  if (!isRecord(payload) || !Array.isArray(payload.choices)) {
    return null;
  }

  const firstChoice = payload.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    return null;
  }

  return typeof firstChoice.message.content === "string" ? firstChoice.message.content : null;
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

export class TokenHubProvider implements LLMProvider {
  name = "tokenhub";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
    private readonly model: string,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: request.stream,
      }),
    });

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new HttpError(502, getProviderErrorMessage(payload) ?? "TokenHub request failed");
    }

    const content = getContent(payload);
    if (!content) {
      throw new HttpError(502, "TokenHub returned empty content");
    }

    return {
      content,
      usage: getUsage(payload),
    };
  }
}
