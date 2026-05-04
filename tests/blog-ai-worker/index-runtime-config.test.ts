import { describe, expect, it } from "vitest";

import worker from "../../blog-ai-worker/src/index";
import type { Env, ExecutionContext } from "../../blog-ai-worker/src/types";

const env: Env = {
  RATE_LIMIT_KV: {
    get: async () => null,
    put: async () => undefined,
  },
  LLM_ACTIVE_PROFILE: "tencent-tokenhub/glm-5.1",
  LLM_PROVIDER_NAME: "tencent-tokenhub",
  LLM_MODEL_ID: "glm-5.1",
  LLM_PROVIDER_API_KEY: "test-key",
  LLM_PROVIDER_BASE_URL: "https://example.com/v1",
  TURNSTILE_SECRET_KEY: "test-turnstile-secret",
  TURNSTILE_ALLOWED_HOSTNAMES: "localhost",
  ALLOWED_ORIGINS: "http://localhost:3000",
  AI_DATA_BASE_URL: "https://example.com/ai-data",
};

const executionContext: ExecutionContext = {
  waitUntil: () => undefined,
  passThroughOnException: () => undefined,
};

function createRequest(): Request {
  return new Request("https://example.com/api/ai/chat", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3000",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scene: "recommend",
      message: "hello",
      cf_turnstile_response: "token",
    }),
  });
}

describe("Worker runtime env validation", () => {
  it.each([
    "LLM_ACTIVE_PROFILE",
    "LLM_PROVIDER_NAME",
    "LLM_MODEL_ID",
    "LLM_PROVIDER_API_KEY",
    "LLM_PROVIDER_BASE_URL",
  ] as const)("缺失 %s 时直接返回配置错误", async (key) => {
    const response = await worker.fetch(
      createRequest(),
      {
        ...env,
        [key]: "",
      },
      executionContext,
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: `Worker misconfigured: ${key} is missing`,
    });
  });
});
