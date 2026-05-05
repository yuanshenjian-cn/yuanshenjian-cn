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

interface BaseAIChatStreamOptions {
  workerUrl: string;
  message: string;
  turnstileToken: string;
  signal?: AbortSignal;
}

export interface RecommendChatStreamOptions extends BaseAIChatStreamOptions {
  scene: "recommend";
  context?: undefined;
  onEvent: (event: RecommendStreamEvent) => void;
}

export interface ArticleChatStreamOptions extends BaseAIChatStreamOptions {
  scene: "article";
  context: { slug: string };
  onEvent: (event: PageStreamEvent) => void;
}

export interface AuthorChatStreamOptions extends BaseAIChatStreamOptions {
  scene: "author";
  context: { page: "author" };
  onEvent: (event: PageStreamEvent) => void;
}

export type AIChatStreamOptions = ArticleChatStreamOptions | AuthorChatStreamOptions;
export type RecommendStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: RecommendReference[] }
  | { type: "done"; usage?: AIUsage }
  | { type: "error"; message: string };

export type PageStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: PageReference[] }
  | { type: "done"; usage?: AIUsage }
  | { type: "error"; message: string };

export type AIReference = RecommendReference;

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
