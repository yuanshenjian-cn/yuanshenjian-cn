import type {
  AIChatStreamOptions,
  AIUsage,
  PageReference,
  PageResponse,
  PageStreamEvent,
  RecommendChatStreamOptions,
  RecommendReference,
  RecommendResponse,
  RecommendStreamEvent,
} from "@/types/ai";

const SSE_EVENT_SEPARATOR = /\r?\n\r?\n/;

export const USER_FACING_AI_ERROR_MESSAGE = "AI 服务刚刚开小差了，请稍后重试。";

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
  const dataLines: string[] = [];

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

function parseRecommendStreamEvent(block: string): RecommendStreamEvent {
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
      if (!isRecord(payload) || !Array.isArray(payload.references) || !payload.references.every(isRecommendReference)) {
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

async function readEventStream<TEvent>(
  response: Response,
  onEvent: (event: TEvent) => void,
  parseEvent: (block: string) => TEvent,
): Promise<void> {
  if (!response.body) {
    throw new Error("AI stream response body is missing");
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    throw new Error("AI stream response is not SSE");
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

      onEvent(parseEvent(trimmedBlock));
    }

    if (done) {
      break;
    }
  }

  const remainingBlock = buffer.trim();
  if (remainingBlock) {
    onEvent(parseEvent(remainingBlock));
  }
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
    throw new Error(getErrorMessage(payload, response.status));
  }

  await readEventStream(response, options.onEvent, parsePageStreamEvent);
}

export async function aiRecommendStream(options: RecommendChatStreamOptions): Promise<void> {
  const workerUrl = options.workerUrl.replace(/\/$/, "");
  const response = await fetch(`${workerUrl}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scene: "recommend",
      message: options.message,
      cf_turnstile_response: options.turnstileToken,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new Error(getErrorMessage(payload, response.status));
  }

  await readEventStream(response, options.onEvent, parseRecommendStreamEvent);
}

export { getErrorMessage, isPageResponse, isRecommendResponse, parsePageStreamEvent, parseRecommendStreamEvent };
