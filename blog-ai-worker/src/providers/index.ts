import type { Env } from "../types";
import { TencentTokenHubProvider } from "./tencent-tokenhub";
import type { LLMProvider } from "./types";

export function createProvider(env: Env, model: string): LLMProvider {
  return new TencentTokenHubProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
}
