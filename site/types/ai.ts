export interface RecommendReference {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  date: string;
  url?: string;
}

export interface PageReference {
  id: string;
  title: string;
  excerpt: string;
  sourceType: "article-section" | "author-section" | "health-section" | "ai-section" | "investment-section";
  url?: string;
  anchorId?: string;
}

export interface AdvisorReference {
  id: string;
  title: string;
  excerpt: string;
  sourceType: PageReference["sourceType"];
  url?: string;
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

export type AdvisorScene = "article" | "author" | "health" | "health-column" | "ai" | "ai-column" | "investment" | "investment-column";

export interface AdvisorContextValue {
  scene: AdvisorScene;
  pageTitle: string;
  domain?: string;
  pageSlug?: string;
  articleSlug?: string;
  quickTopics: AIQuickTopic[];
}

export interface AdvisorStreamContext {
  scene: AdvisorScene;
  domain?: string;
  pageTitle: string;
  pageSlug?: string;
  articleSlug?: string;
  history: string[];
}

export interface ContextualAdvisorStreamOptions extends BaseAIChatStreamOptions {
  context: AdvisorStreamContext;
  onEvent: (event: AdvisorStreamEvent) => void;
}

export interface ArticleRecommendationStreamOptions extends BaseAIChatStreamOptions {
  scene: "article_recommendation";
  context?: undefined;
  onEvent: (event: RecommendStreamEvent) => void;
}

export interface AiBriefingRecommendationStreamOptions extends BaseAIChatStreamOptions {
  scene: "ai_briefing_recommendation";
  context: { range: "today" | "3d" | "7d" | "14d" | "30d" };
  onEvent: (event: RecommendStreamEvent) => void;
}

export interface InvestmentBriefingRecommendationStreamOptions extends BaseAIChatStreamOptions {
  scene: "investment_briefing_recommendation";
  context: { range: "3d" | "7d" | "14d" | "30d" };
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

export type AdvisorStreamEvent =
  | { type: "answer-delta"; delta: string }
  | { type: "references"; references: AdvisorReference[] }
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
  size?: "normal" | "flexible" | "compact" | "invisible";
  execution?: "execute" | "render";
  appearance?: "execute" | "always" | "interaction-only";
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  "unsupported-callback"?: () => void;
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
