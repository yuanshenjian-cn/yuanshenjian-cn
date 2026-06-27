export interface AskAdvisorRequest {
  question: string;
  useGlobalGlossary?: boolean;
}

type AskAdvisorListener = (request: AskAdvisorRequest) => void;

const EVENT_NAME = "ysj:ask-advisor";

function normalizeAskAdvisorRequest(detail: unknown): AskAdvisorRequest | null {
  if (typeof detail === "string") {
    return { question: detail };
  }
  if (!detail || typeof detail !== "object") {
    return null;
  }
  const candidate = detail as Record<string, unknown>;
  const question = candidate.question;
  const useGlobalGlossary = candidate.useGlobalGlossary;
  if (typeof question !== "string" || question.trim().length === 0) {
    return null;
  }
  return {
    question,
    useGlobalGlossary: typeof useGlobalGlossary === "boolean" ? useGlobalGlossary : undefined,
  };
}

export function emitAskAdvisor(request: string | AskAdvisorRequest): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: typeof request === "string" ? { question: request } : request }));
}

export function onAskAdvisor(listener: AskAdvisorListener): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handler = (event: Event) => {
    if (!(event instanceof CustomEvent)) {
      return;
    }
    const request = normalizeAskAdvisorRequest(event.detail);
    if (!request) {
      return;
    }
    listener(request);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
