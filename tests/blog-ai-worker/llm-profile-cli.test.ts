import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deployProfile, loadProfilesConfig, useProfile } from "../../blog-ai-worker/scripts/llm-profile-cli.mjs";

const VALID_PROFILES_JSONC = `{
  // local profiles
  "version": 1,
  "providers": {
    "tencent-tokenhub": {
      "label": "Tencent TokenHub",
      "baseUrl": "https://tokenhub.tencentmaas.com/v1/private-path",
      "apiKey": "test-key",
      "models": {
        "glm-5.1": {
          "modelId": "glm-5.1",
        },
        "kimi-k2.6": {
          "modelId": "moonshot-v1-8k",
        },
      },
    },
  },
}`;

const UNSUPPORTED_PROVIDER_JSONC = `{
  "version": 1,
  "providers": {
    "unknown-provider": {
      "baseUrl": "https://example.com/v1",
      "apiKey": "test-key",
      "models": {
        "v4-pro": {
          "modelId": "example-model"
        }
      }
    }
  }
}`;

describe("llm-profile-cli", () => {
  let workerDir: string;

  beforeEach(async () => {
    workerDir = await mkdtemp(path.join(os.tmpdir(), "blog-ai-worker-"));
  });

  afterEach(async () => {
    await rm(workerDir, { recursive: true, force: true });
  });

  it("支持解析 JSONC profile 配置", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const config = await loadProfilesConfig({ workerDir });

    expect(config.profiles).toEqual([
      expect.objectContaining({
        selector: "tencent-tokenhub/glm-5.1",
        modelId: "glm-5.1",
      }),
      expect.objectContaining({
        selector: "tencent-tokenhub/kimi-k2.6",
        modelId: "moonshot-v1-8k",
      }),
    ]);
  });

  it("缺少配置文件时给出明确提示", async () => {
    await expect(loadProfilesConfig({ workerDir })).rejects.toThrow(
      "llm-profiles.local.jsonc is missing. Copy llm-profiles.example.jsonc to llm-profiles.local.jsonc first.",
    );
  });

  it("JSONC 非法时给出明确提示", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), '{ invalid jsonc', "utf8");

    await expect(loadProfilesConfig({ workerDir })).rejects.toThrow("llm-profiles.local.jsonc is not valid JSONC");
  });

  it("缺少关键字段时给出明确配置路径", async () => {
    await writeFile(
      path.join(workerDir, "llm-profiles.local.jsonc"),
      `{
        "version": 1,
        "providers": {
          "tencent-tokenhub": {
            "baseUrl": "https://tokenhub.tencentmaas.com/v1",
            "apiKey": "test-key",
            "models": {
              "glm-5.1": {}
            }
          }
        }
      }`,
      "utf8",
    );

    await expect(loadProfilesConfig({ workerDir })).rejects.toThrow(
      "providers.tencent-tokenhub.models.glm-5.1.modelId is required",
    );
  });

  it("unknown selector 时直接失败", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    await expect(useProfile("tencent-tokenhub/unknown-model", { workerDir })).rejects.toThrow(
      "Unknown profile: tencent-tokenhub/unknown-model",
    );
  });

  it("不支持的 provider 在 CLI 阶段就失败", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), UNSUPPORTED_PROVIDER_JSONC, "utf8");

    await expect(useProfile("unknown-provider/v4-pro", { workerDir })).rejects.toThrow(
      "Unsupported provider in profile unknown-provider/v4-pro: unknown-provider. Implement it in blog-ai-worker/src/providers/index.ts first.",
    );
  });

  it("llm:use 只写本地 active profile 文件", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const profile = await useProfile("tencent-tokenhub/glm-5.1", { workerDir });
    const activeProfile = await readFile(path.join(workerDir, ".llm-active-profile"), "utf8");

    expect(profile.selector).toBe("tencent-tokenhub/glm-5.1");
    expect(activeProfile.trim()).toBe("tencent-tokenhub/glm-5.1");
  });

  it("llm:deploy 无显式参数时读取 active profile 并调用 wrangler secret bulk + deploy", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");
    await writeFile(path.join(workerDir, ".llm-active-profile"), "tencent-tokenhub/kimi-k2.6\n", "utf8");

    const runCommand = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });

    const profile = await deployProfile(undefined, {
      workerDir,
      runCommand,
    });

    expect(profile.selector).toBe("tencent-tokenhub/kimi-k2.6");
    expect(runCommand).toHaveBeenCalledTimes(2);
    expect(runCommand).toHaveBeenNthCalledWith(
      1,
      "wrangler",
      ["secret", "bulk"],
      expect.objectContaining({
        cwd: workerDir,
        input: expect.any(String),
      }),
    );
    expect(runCommand).toHaveBeenNthCalledWith(
      2,
      "wrangler",
      ["deploy"],
      expect.objectContaining({
        cwd: workerDir,
      }),
    );
    expect(JSON.parse(String(runCommand.mock.calls[0]?.[2]?.input))).toEqual({
      LLM_ACTIVE_PROFILE: "tencent-tokenhub/kimi-k2.6",
      LLM_PROVIDER_NAME: "tencent-tokenhub",
      LLM_MODEL_ID: "moonshot-v1-8k",
      LLM_PROVIDER_BASE_URL: "https://tokenhub.tencentmaas.com/v1/private-path",
      LLM_PROVIDER_API_KEY: "test-key",
    });
  });

  it("llm:deploy 显式参数时先更新 active profile，再按该配置部署", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });

    await deployProfile("tencent-tokenhub/glm-5.1", {
      workerDir,
      runCommand,
    });

    const activeProfile = await readFile(path.join(workerDir, ".llm-active-profile"), "utf8");

    expect(activeProfile.trim()).toBe("tencent-tokenhub/glm-5.1");
    expect(JSON.parse(String(runCommand.mock.calls[0]?.[2]?.input))).toMatchObject({
      LLM_ACTIVE_PROFILE: "tencent-tokenhub/glm-5.1",
      LLM_MODEL_ID: "glm-5.1",
    });
  });

  it("wrangler secret bulk 失败时给出清晰错误并提示 active 已更新", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi.fn().mockRejectedValueOnce(new Error("bulk failed"));

    await expect(
      deployProfile("tencent-tokenhub/glm-5.1", {
        workerDir,
        runCommand,
      }),
    ).rejects.toThrow(
      "Failed to upload LLM secrets with wrangler secret bulk after local active profile was set to tencent-tokenhub/glm-5.1: bulk failed",
    );
  });

  it("wrangler deploy 失败时给出清晰错误并提示 active 已更新", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockRejectedValueOnce(new Error("deploy failed"));

    await expect(
      deployProfile("tencent-tokenhub/glm-5.1", {
        workerDir,
        runCommand,
      }),
    ).rejects.toThrow(
      "Failed to run wrangler deploy after local active profile was set to tencent-tokenhub/glm-5.1: deploy failed",
    );
  });
});
