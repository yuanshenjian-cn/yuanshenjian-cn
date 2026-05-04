import type { Env } from "../types";
import { TokenHubProvider } from "./tokenhub";
import type { LLMProvider } from "./types";

export function createProvider(env: Env, model: string): LLMProvider {
  return new TokenHubProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
}
