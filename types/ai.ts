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

export interface RecommendRequestPayload {
  scene: "recommend";
  message: string;
  cf_turnstile_response: string;
}

export interface ArticleRequestPayload {
  scene: "article";
  message: string;
  context: { slug: string };
  cf_turnstile_response: string;
}

export interface AuthorRequestPayload {
  scene: "author";
  message: string;
  context: { page: "author" };
  cf_turnstile_response: string;
}

export type AIChatRequest = RecommendRequestPayload | ArticleRequestPayload | AuthorRequestPayload;

interface BaseAIChatOptions {
  workerUrl: string;
  message: string;
  turnstileToken: string;
}

export interface RecommendChatOptions extends BaseAIChatOptions {
  scene: "recommend";
  context?: undefined;
}

export interface ArticleChatOptions extends BaseAIChatOptions {
  scene: "article";
  context: { slug: string };
}

export interface AuthorChatOptions extends BaseAIChatOptions {
  scene: "author";
  context: { page: "author" };
}

export type AIChatOptions = RecommendChatOptions | ArticleChatOptions | AuthorChatOptions;

interface BaseAIChatStreamOptions {
  workerUrl: string;
  message: string;
  turnstileToken: string;
  signal?: AbortSignal;
  onEvent: (event: PageStreamEvent) => void;
}

export interface ArticleChatStreamOptions extends BaseAIChatStreamOptions {
  scene: "article";
  context: { slug: string };
}

export interface AuthorChatStreamOptions extends BaseAIChatStreamOptions {
  scene: "author";
  context: { page: "author" };
}

export type AIChatStreamOptions = ArticleChatStreamOptions | AuthorChatStreamOptions;
export type PageChatOptions = ArticleChatOptions | AuthorChatOptions;

export type PageStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: PageReference[] }
  | { type: "done"; usage?: AIUsage }
  | { type: "error"; message: string };

export type AIReference = RecommendReference;
export type AIChatResponse = RecommendResponse | PageResponse;
export type AIChatResponseByScene<T extends AIChatOptions["scene"]> = T extends "recommend"
  ? RecommendResponse
  : PageResponse;

export interface AIQuickTopic {
  label: string;
  prompt: string;
}

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  size?: "normal" | "flexible" | "compact";
  execution?: "execute" | "render";
  appearance?: "execute" | "always" | "interaction-only";
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
}

export interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export {};
