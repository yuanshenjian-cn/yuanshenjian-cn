export interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface Env {
  RATE_LIMIT_KV: KVNamespace;
  LLM_PROVIDER_API_KEY: string;
  LLM_PROVIDER_BASE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_WINDOW_SECONDS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  AI_DATA_BASE_URL: string;
}

export type ChatScene = "recommend";

export interface ChatRequestBody {
  scene: ChatScene;
  message: string;
  context?: Record<string, unknown>;
  cf_turnstile_response: string;
}

export interface AIReference {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
}

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AIChatResponse {
  answer: string;
  references: AIReference[];
  usage?: AIUsage;
}

export class HttpError extends Error {
  status: number;
  headers: HeadersInit;

  constructor(status: number, message: string, headers: HeadersInit = {}) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.headers = headers;
  }
}
