import { afterEach, describe, expect, it, vi } from "vitest";

import { SUPPORTED_LLM_PROVIDERS, createProvider, isSupportedLLMProvider } from "../../blog-ai-worker/src/providers";
import type { Env } from "../../blog-ai-worker/src/types";

const env: Env = {
  RATE_LIMIT_KV: {
    get: vi.fn(),
    put: vi.fn(),
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

describe("createProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("按 env.LLM_PROVIDER_NAME 路由，并使用 env.LLM_MODEL_ID 调用上游模型", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "ok",
              },
            },
          ],
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    const provider = createProvider(env, env.LLM_MODEL_ID);
    await provider.chat({
      messages: [
        {
          role: "user",
          content: "hello",
        },
      ],
      maxTokens: 100,
      temperature: 0.4,
      stream: false,
    });

    expect(provider.name).toBe("tencent-tokenhub");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.com/v1/chat/completions");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "glm-5.1",
    });
  });

  it("导出的支持列表与 provider 判断函数一致", () => {
    expect(SUPPORTED_LLM_PROVIDERS).toEqual(["tencent-tokenhub", "deepseek", "moonshot-cn"]);
    expect(isSupportedLLMProvider("tencent-tokenhub")).toBe(true);
    expect(isSupportedLLMProvider("deepseek")).toBe(true);
    expect(isSupportedLLMProvider("moonshot-cn")).toBe(true);
    expect(isSupportedLLMProvider("unknown-provider")).toBe(false);
  });

  it("deepseek provider 可正常路由", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok" } }],
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const provider = createProvider(
      {
        ...env,
        LLM_PROVIDER_NAME: "deepseek",
        LLM_PROVIDER_BASE_URL: "https://api.deepseek.com/v1",
        LLM_MODEL_ID: "deepseek-v4-flash",
      },
      "deepseek-v4-flash",
    );

    await provider.chat({
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 100,
      temperature: 0.4,
      stream: false,
    });

    expect(provider.name).toBe("deepseek");
    const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
    expect(url).toBe("https://api.deepseek.com/v1/chat/completions");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "deepseek-v4-flash" });
  });

  it("moonshot-cn provider 可正常路由", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "ok" } }],
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const provider = createProvider(
      {
        ...env,
        LLM_PROVIDER_NAME: "moonshot-cn",
        LLM_PROVIDER_BASE_URL: "https://api.moonshot.cn/v1",
        LLM_MODEL_ID: "moonshot-v1-8k",
      },
      "moonshot-v1-8k",
    );

    await provider.chat({
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 100,
      temperature: 0.4,
      stream: false,
    });

    expect(provider.name).toBe("moonshot-cn");
    const [url, init] = fetchMock.mock.calls.at(-1) ?? [];
    expect(url).toBe("https://api.moonshot.cn/v1/chat/completions");
    expect(JSON.parse(String(init?.body))).toMatchObject({ model: "moonshot-v1-8k" });
  });

  it("未知 provider 直接抛出清晰错误", () => {
    expect(() =>
      createProvider(
        {
          ...env,
          LLM_PROVIDER_NAME: "unknown-provider",
        },
        env.LLM_MODEL_ID,
      ),
    ).toThrowError('Worker misconfigured: unsupported LLM provider "unknown-provider"');
  });
});
