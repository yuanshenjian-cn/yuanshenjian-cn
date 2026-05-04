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
  LLM_ACTIVE_PROFILE: string;
  LLM_PROVIDER_NAME: string;
  LLM_MODEL_ID: string;
  LLM_PROVIDER_API_KEY: string;
  LLM_PROVIDER_BASE_URL: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_ALLOWED_HOSTNAMES: string;
  TURNSTILE_EXPECTED_ACTION?: string;
  ALLOWED_ORIGINS: string;
  AI_IP_RATE_LIMIT_WINDOW_SECONDS?: string;
  AI_IP_RATE_LIMIT_MAX_REQUESTS?: string;
  AI_EMERGENCY_DISABLE?: string;
  AI_DAILY_REQUEST_LIMIT?: string;
  AI_REQUEST_MAX_BODY_BYTES?: string;
  AI_REQUEST_MAX_MESSAGE_CHARS?: string;
  AI_DATA_BASE_URL: string;
}

export type ChatScene = "recommend" | "article" | "author";
export type PageScene = "article" | "author";

export interface RecommendRequestBody {
  scene: "recommend";
  message: string;
  cf_turnstile_response: string;
}

export interface ArticleRequestBody {
  scene: "article";
  message: string;
  context: {
    slug: string;
  };
  cf_turnstile_response: string;
}

export interface AuthorRequestBody {
  scene: "author";
  message: string;
  context: {
    page: "author";
  };
  cf_turnstile_response: string;
}

export type ChatRequestBody = RecommendRequestBody | ArticleRequestBody | AuthorRequestBody;

export interface RecommendReference {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
}

export interface PageReference {
  id: string;
  title: string;
  excerpt: string;
  sourceType: "article-section" | "author-section";
  anchorId?: string;
}

export interface AIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface RecommendResponse {
  answer: string;
  references: RecommendReference[];
  usage?: AIUsage;
}

export interface PageResponse {
  answer: string;
  references: PageReference[];
  usage?: AIUsage;
}

export interface PageSection {
  id: string;
  heading: string;
  content: string;
  excerpt: string;
  anchorId?: string;
}

export interface ArticlePageData {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  sections: PageSection[];
}

export interface AuthorPageData {
  slug: "author";
  title: string;
  summary: string;
  sections: PageSection[];
}

export type PageData = ArticlePageData | AuthorPageData;

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
