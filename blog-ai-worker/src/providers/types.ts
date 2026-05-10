import type { AIUsage } from "../types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

export interface ChatResponse {
  content: string;
  usage?: AIUsage;
}

export interface LLMProvider {
  name: string;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat?(request: ChatRequest): Promise<ReadableStream<Uint8Array>>;
}
