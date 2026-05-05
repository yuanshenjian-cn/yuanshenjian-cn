import { createProvider } from "../providers";
import type { ChatRequest, ChatResponse } from "../providers/types";
import type {
  AIUsage,
  Env,
  PageData,
  PageReference,
  PageResponse,
  PageScene,
  PageSection,
} from "../types";
import { HttpError } from "../types";
import { eventStreamResponse } from "../utils/response";

export const PAGE_REFERENCE_DELIMITER = "<<<AI_PAGE_REFERENCES>>>";
export const PAGE_AI_ERROR_MESSAGE = "AI 暂时无法整理当前页面内容，请稍后再试。";

const MAX_REFERENCES = 3;

interface TailPayload {
  sectionIds: string[];
}

interface ParsedPageOutput {
  answer: string;
  sectionIds: string[];
}

interface BuildPageSceneOptions {
  env: Env;
  scene: PageScene;
  pageDataPath: string;
  sourceType: PageReference["sourceType"];
  message: string;
  validatePageData?: (value: unknown) => value is PageData;
  getReferenceSections?: (pageData: PageData) => PageSection[];
  buildSystemPrompt: (pageData: PageData) => string;
  origin?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPageSection(value: unknown): value is PageSection {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.heading === "string" &&
    typeof value.content === "string" &&
    typeof value.excerpt === "string" &&
    (value.anchorId === undefined || typeof value.anchorId === "string")
  );
}

export function isPageData(value: unknown): value is PageData {
  return (
    isRecord(value) &&
    typeof value.slug === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.sections) &&
    value.sections.every(isPageSection)
  );
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

function parseTailPayload(value: string): TailPayload {
  const payload: unknown = JSON.parse(value);

  if (!isRecord(payload) || !Array.isArray(payload.sectionIds) || !payload.sectionIds.every((id) => typeof id === "string")) {
    throw new Error("Invalid page reference tail payload");
  }

  return {
    sectionIds: payload.sectionIds,
  };
}

function parsePageOutput(content: string): ParsedPageOutput {
  const delimiterIndex = content.indexOf(PAGE_REFERENCE_DELIMITER);

  if (delimiterIndex < 0) {
    return {
      answer: content.trim(),
      sectionIds: [],
    };
  }

  const answer = content.slice(0, delimiterIndex).trim();
  const tail = content.slice(delimiterIndex + PAGE_REFERENCE_DELIMITER.length).trim();

  try {
    return {
      answer,
      sectionIds: parseTailPayload(tail).sectionIds,
    };
  } catch {
    return {
      answer,
      sectionIds: [],
    };
  }
}

export function assemblePageReferences(
  sections: PageSection[],
  sourceType: PageReference["sourceType"],
  sectionIds: string[],
): PageReference[] {
  const sectionMap = new Map(sections.map((section) => [section.id, section]));
  const uniqueIds = Array.from(new Set(sectionIds));

  return uniqueIds
    .map((id) => sectionMap.get(id))
    .filter((section): section is PageSection => section !== undefined)
    .slice(0, MAX_REFERENCES)
    .map((section) => ({
      id: section.id,
      title: section.heading,
      excerpt: section.excerpt,
      sourceType,
      anchorId: section.anchorId,
    }));
}

async function fetchPageData(
  env: Env,
  pageDataPath: string,
  validatePageData: (value: unknown) => value is PageData = isPageData,
): Promise<PageData> {
  const response = await fetch(`${env.AI_DATA_BASE_URL.replace(/\/$/, "")}/${pageDataPath.replace(/^\//, "")}`);

  if (!response.ok) {
    throw new HttpError(502, PAGE_AI_ERROR_MESSAGE);
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!validatePageData(payload)) {
    throw new HttpError(502, PAGE_AI_ERROR_MESSAGE);
  }

  return payload;
}

function createChatRequest(systemPrompt: string, message: string, stream: boolean): ChatRequest {
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
    maxTokens: 900,
    temperature: 0.3,
    stream,
  };
}

export async function handlePageScene(options: BuildPageSceneOptions): Promise<PageResponse> {
  const pageData = await fetchPageData(options.env, options.pageDataPath, options.validatePageData);
  const provider = createProvider(options.env, options.env.LLM_MODEL_ID);
  const llmResponse: ChatResponse = await provider.chat(
    createChatRequest(options.buildSystemPrompt(pageData), options.message, false),
  );

  const parsed = parsePageOutput(llmResponse.content);
  const referenceSections = options.getReferenceSections?.(pageData) ?? (Array.isArray(pageData.sections) ? pageData.sections : []);

  return {
    answer: parsed.answer,
    references: assemblePageReferences(referenceSections, options.sourceType, parsed.sectionIds),
    usage: llmResponse.usage,
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

function createAnswerStreamProcessor(onDelta: (delta: string) => void) {
  let beforeDelimiterBuffer = "";
  let tailBuffer = "";
  let sawDelimiter = false;

  function flushSafePrefix() {
    const safeLength = Math.max(0, beforeDelimiterBuffer.length - (PAGE_REFERENCE_DELIMITER.length - 1));
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
      const delimiterIndex = beforeDelimiterBuffer.indexOf(PAGE_REFERENCE_DELIMITER);

      if (delimiterIndex >= 0) {
        const answerChunk = beforeDelimiterBuffer.slice(0, delimiterIndex);
        if (answerChunk) {
          onDelta(answerChunk);
        }

        tailBuffer += beforeDelimiterBuffer.slice(delimiterIndex + PAGE_REFERENCE_DELIMITER.length);
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

export async function handlePageSceneStream(options: BuildPageSceneOptions): Promise<Response> {
  const pageData = await fetchPageData(options.env, options.pageDataPath, options.validatePageData);
  const provider = createProvider(options.env, options.env.LLM_MODEL_ID);

  if (!provider.streamChat) {
    throw new HttpError(501, "Current AI provider does not support streaming");
  }

  const upstreamStream = await provider.streamChat(
    createChatRequest(options.buildSystemPrompt(pageData), options.message, true),
  );
  const referenceSections = options.getReferenceSections?.(pageData) ?? (Array.isArray(pageData.sections) ? pageData.sections : []);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamStream.getReader();
      const decoder = new TextDecoder();
      const processor = createAnswerStreamProcessor((delta) => {
        controller.enqueue(encodeSSEEvent("answer-delta", { delta }));
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
        let sectionIds: string[] = [];

        if (result.sawDelimiter) {
          try {
            sectionIds = parseTailPayload(result.tail).sectionIds;
          } catch {
            sectionIds = [];
          }
        }

        const references = assemblePageReferences(referenceSections, options.sourceType, sectionIds);
        controller.enqueue(encodeSSEEvent("references", { references }));
        controller.enqueue(encodeSSEEvent("done", { usage }));
        controller.close();
      } catch {
        controller.enqueue(encodeSSEEvent("error", { message: PAGE_AI_ERROR_MESSAGE }));
        controller.close();
      }
    },
  });

  return eventStreamResponse(stream, options.origin);
}

export {
  parsePageOutput,
};
