import supportedProviders from "../../supported-llm-providers.json";

import type { Env } from "../types";
import { DeepSeekProvider } from "./deepseek";
import { HttpError } from "../types";
import { MoonshotCnProvider } from "./moonshot-cn";
import { TencentTokenHubProvider } from "./tencent-tokenhub";
import type { LLMProvider } from "./types";

export const SUPPORTED_LLM_PROVIDERS = supportedProviders as string[];

export function isSupportedLLMProvider(providerName: string): boolean {
  return SUPPORTED_LLM_PROVIDERS.includes(providerName);
}

export function createProvider(env: Env, model: string): LLMProvider {
  switch (env.LLM_PROVIDER_NAME) {
    case "tencent-tokenhub":
      return new TencentTokenHubProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
    case "deepseek":
      return new DeepSeekProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
    case "moonshot-cn":
      return new MoonshotCnProvider(env.LLM_PROVIDER_API_KEY, env.LLM_PROVIDER_BASE_URL, model);
    default:
      throw new HttpError(500, `Worker misconfigured: unsupported LLM provider "${env.LLM_PROVIDER_NAME}"`);
  }
}
