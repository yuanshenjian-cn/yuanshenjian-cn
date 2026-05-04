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

export interface AIChatOptions {
  workerUrl: string;
  scene: "recommend";
  message: string;
  turnstileToken: string;
  context?: Record<string, unknown>;
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
