import type {
  AIChatOptions,
  AIChatResponse,
  AIChatResponseByScene,
  AIChatRequest,
  AIChatStreamOptions,
  AIUsage,
  PageReference,
  PageResponse,
  PageStreamEvent,
  RecommendReference,
  RecommendResponse,
} from "@/types/ai";

const SSE_EVENT_SEPARATOR = /\r?\n\r?\n/;

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

function isRecommendReference(value: unknown): value is RecommendReference {
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

function isPageReference(value: unknown): value is PageReference {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.excerpt === "string" &&
    (value.sourceType === "article-section" || value.sourceType === "author-section") &&
    (value.anchorId === undefined || typeof value.anchorId === "string")
  );
}

function isRecommendResponse(value: unknown): value is RecommendResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.answer === "string" &&
    Array.isArray(value.references) &&
    value.references.every(isRecommendReference) &&
    (value.usage === undefined || isUsage(value.usage))
  );
}

function isPageResponse(value: unknown): value is PageResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.answer === "string" &&
    Array.isArray(value.references) &&
    value.references.every(isPageReference) &&
    (value.usage === undefined || isUsage(value.usage))
  );
}

function isAIChatResponse(value: unknown): value is AIChatResponse {
  return isRecommendResponse(value) || isPageResponse(value);
}

function toRequestPayload(options: AIChatOptions): AIChatRequest {
  if (options.scene === "recommend") {
    return {
      scene: "recommend",
      message: options.message,
      cf_turnstile_response: options.turnstileToken,
    };
  }

  if (options.scene === "article") {
    return {
      scene: "article",
      message: options.message,
      context: options.context,
      cf_turnstile_response: options.turnstileToken,
    };
  }

  return {
    scene: "author",
    message: options.message,
    context: options.context,
    cf_turnstile_response: options.turnstileToken,
  };
}

export class AIStreamUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIStreamUnsupportedError";
  }
}

function getErrorMessage(payload: unknown, status: number): string {
  if (isRecord(payload) && typeof payload.error === "string") {
    return payload.error;
  }

  return `AI request failed with status ${status}`;
}

function parseSSEEventBlock(block: string): { event: string; data: string } | null {
  const lines = block
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  let event = "message";
  const dataLines = [] as string[];

  for (const line of lines) {
    if (line.startsWith(":") || !line.includes(":")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    const field = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1).trimStart();

    if (field === "event") {
      event = value;
      continue;
    }

    if (field === "data") {
      dataLines.push(value);
    }
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
}

function parsePageStreamEvent(block: string): PageStreamEvent {
  const parsedEvent = parseSSEEventBlock(block);
  if (!parsedEvent) {
    throw new Error("Invalid SSE event block");
  }

  const payload: unknown = parsedEvent.data ? JSON.parse(parsedEvent.data) : {};

  switch (parsedEvent.event) {
    case "answer-delta":
      if (!isRecord(payload) || typeof payload.delta !== "string") {
        throw new Error("Invalid answer-delta event payload");
      }

      return {
        type: "answer-delta",
        delta: payload.delta,
      };
    case "references":
      if (!isRecord(payload) || !Array.isArray(payload.references) || !payload.references.every(isPageReference)) {
        throw new Error("Invalid references event payload");
      }

      return {
        type: "references",
        references: payload.references,
      };
    case "done":
      if (!isRecord(payload) || (payload.usage !== undefined && !isUsage(payload.usage))) {
        throw new Error("Invalid done event payload");
      }

      return {
        type: "done",
        usage: payload.usage,
      };
    case "error":
      if (!isRecord(payload) || typeof payload.message !== "string") {
        throw new Error("Invalid error event payload");
      }

      return {
        type: "error",
        message: payload.message,
      };
    default:
      throw new Error(`Unsupported SSE event: ${parsedEvent.event}`);
  }
}

export async function aiChat<TScene extends AIChatOptions["scene"]>(
  options: Extract<AIChatOptions, { scene: TScene }>,
): Promise<AIChatResponseByScene<TScene>> {
  const workerUrl = options.workerUrl.replace(/\/$/, "");
  const response = await fetch(`${workerUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(toRequestPayload(options)),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (!isAIChatResponse(payload)) {
    throw new Error("Invalid AI response payload");
  }

  return payload as AIChatResponseByScene<TScene>;
}

export async function aiChatStream(options: AIChatStreamOptions): Promise<void> {
  const workerUrl = options.workerUrl.replace(/\/$/, "");
  const response = await fetch(`${workerUrl}/chat/stream`, {
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
    signal: options.signal,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const message = getErrorMessage(payload, response.status);

    if (response.status === 404 || response.status === 501) {
      throw new AIStreamUnsupportedError(message);
    }

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("AI stream response body is missing");
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    throw new AIStreamUnsupportedError("AI stream response is not SSE");
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const blocks = buffer.split(SSE_EVENT_SEPARATOR);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const trimmedBlock = block.trim();
      if (!trimmedBlock) {
        continue;
      }

      options.onEvent(parsePageStreamEvent(trimmedBlock));
    }

    if (done) {
      break;
    }
  }

  const remainingBlock = buffer.trim();
  if (remainingBlock) {
    options.onEvent(parsePageStreamEvent(remainingBlock));
  }
}

export {
  getErrorMessage,
  isAIChatResponse,
  parsePageStreamEvent,
};
