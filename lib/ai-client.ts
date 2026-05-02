import type { AIChatOptions, AIChatResponse, AIReference, AIUsage } from "@/types/ai";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isUsage(value: unknown): value is AIUsage {
  if (!isRecord(value)) {
    return false;
  }

  const { promptTokens, completionTokens, totalTokens } = value;

  return (
    (promptTokens === undefined || typeof promptTokens === "number") &&
    (completionTokens === undefined || typeof completionTokens === "number") &&
    (totalTokens === undefined || typeof totalTokens === "number")
  );
}

function isReference(value: unknown): value is AIReference {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    typeof value.date === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === "string")
  );
}

function isAIChatResponse(value: unknown): value is AIChatResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.answer === "string" &&
    Array.isArray(value.references) &&
    value.references.every(isReference) &&
    (value.usage === undefined || isUsage(value.usage))
  );
}

function getErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return `AI request failed with status ${status}`;
}

export async function aiChat(options: AIChatOptions): Promise<AIChatResponse> {
  const workerUrl = options.workerUrl.replace(/\/$/, "");
  const response = await fetch(`${workerUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scene: options.scene,
      message: options.message,
      context: options.context,
      cf_turnstile_response: options.turnstileToken,
    }),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (!isAIChatResponse(payload)) {
    throw new Error("Invalid AI response payload");
  }

  return payload;
}
