import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deployProfile, loadProfilesConfig, useProfile } from "../../blog-ai-worker/scripts/llm-profile-cli.mjs";

const VALID_PROFILES_JSONC = `{
  // local profiles
  "version": 1,
  "providers": {
    "deepseek": {
      "label": "DeepSeek",
      "baseUrl": "https://api.deepseek.com/v1/private-path",
      "apiKey": "test-key",
      "models": {
        "deepseek-v4-flash": {
          "modelId": "deepseek-v4-flash",
        }
      }
    },
    "moonshot-cn": {
      "label": "Moonshot CN",
      "baseUrl": "https://api.moonshot.cn/v1/private-path",
      "apiKey": "moonshot-test-key",
      "models": {
        "kimi-k2.6": {
          "modelId": "kimi-k2.6"
        }
      }
    }
  }
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
        selector: "deepseek/deepseek-v4-flash",
        modelId: "deepseek-v4-flash",
      }),
      expect.objectContaining({
        selector: "moonshot-cn/kimi-k2.6",
        modelId: "kimi-k2.6",
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
          "deepseek": {
            "baseUrl": "https://api.deepseek.com/v1",
            "apiKey": "test-key",
            "models": {
              "deepseek-v4-flash": {}
            }
          }
        }
      }`,
      "utf8",
    );

    await expect(loadProfilesConfig({ workerDir })).rejects.toThrow(
      "providers.deepseek.models.deepseek-v4-flash.modelId is required",
    );
  });

  it("unknown selector 时直接失败", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    await expect(useProfile("deepseek/unknown-model", { workerDir })).rejects.toThrow(
      "Unknown profile: deepseek/unknown-model",
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

    const profile = await useProfile("deepseek/deepseek-v4-flash", { workerDir });
    const activeProfile = await readFile(path.join(workerDir, ".llm-active-profile"), "utf8");

    expect(profile.selector).toBe("deepseek/deepseek-v4-flash");
    expect(activeProfile.trim()).toBe("deepseek/deepseek-v4-flash");
  });

  it("llm:deploy 无显式参数时读取 active profile，并以 4 个 vars + 1 个 secret 部署", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");
    await writeFile(path.join(workerDir, ".llm-active-profile"), "moonshot-cn/kimi-k2.6\n", "utf8");

    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify([
          { name: "LLM_ACTIVE_PROFILE", type: "secret_text" },
          { name: "LLM_PROVIDER_NAME", type: "secret_text" },
          { name: "LLM_MODEL_ID", type: "secret_text" },
          { name: "LLM_PROVIDER_BASE_URL", type: "secret_text" },
          { name: "LLM_PROVIDER_API_KEY", type: "secret_text" },
        ]),
        stderr: "",
      })
      .mockResolvedValue({ stdout: "", stderr: "" });

    const profile = await deployProfile(undefined, {
      workerDir,
      runCommand,
    });

    expect(profile.selector).toBe("moonshot-cn/kimi-k2.6");
    expect(runCommand).toHaveBeenCalledTimes(7);
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
      [
        "deploy",
        "--keep-vars",
        "--var",
        "LLM_ACTIVE_PROFILE:moonshot-cn/kimi-k2.6",
        "--var",
        "LLM_PROVIDER_NAME:moonshot-cn",
        "--var",
        "LLM_MODEL_ID:kimi-k2.6",
        "--var",
        "LLM_PROVIDER_BASE_URL:https://api.moonshot.cn/v1/private-path",
      ],
      expect.objectContaining({
        cwd: workerDir,
      }),
    );
    expect(JSON.parse(String(runCommand.mock.calls[0]?.[2]?.input))).toEqual({
      LLM_PROVIDER_API_KEY: "moonshot-test-key",
    });
    expect(runCommand).toHaveBeenNthCalledWith(
      3,
      "wrangler",
      ["secret", "list", "--format", "json"],
      expect.objectContaining({ cwd: workerDir }),
    );
    expect(runCommand).toHaveBeenNthCalledWith(
      4,
      "wrangler",
      ["secret", "delete", "LLM_ACTIVE_PROFILE"],
      expect.objectContaining({ cwd: workerDir }),
    );
    expect(runCommand).toHaveBeenNthCalledWith(
      5,
      "wrangler",
      ["secret", "delete", "LLM_PROVIDER_NAME"],
      expect.objectContaining({ cwd: workerDir }),
    );
    expect(runCommand).toHaveBeenNthCalledWith(
      6,
      "wrangler",
      ["secret", "delete", "LLM_MODEL_ID"],
      expect.objectContaining({ cwd: workerDir }),
    );
    expect(runCommand).toHaveBeenNthCalledWith(
      7,
      "wrangler",
      ["secret", "delete", "LLM_PROVIDER_BASE_URL"],
      expect.objectContaining({ cwd: workerDir }),
    );
  });

  it("llm:deploy 显式参数时先更新 active profile，再按该配置部署", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: JSON.stringify([]), stderr: "" });

    await deployProfile("deepseek/deepseek-v4-flash", {
      workerDir,
      runCommand,
    });

    const activeProfile = await readFile(path.join(workerDir, ".llm-active-profile"), "utf8");

    expect(activeProfile.trim()).toBe("deepseek/deepseek-v4-flash");
    expect(JSON.parse(String(runCommand.mock.calls[0]?.[2]?.input))).toMatchObject({
      LLM_PROVIDER_API_KEY: "test-key",
    });
    expect(runCommand).toHaveBeenNthCalledWith(
      2,
      "wrangler",
      expect.arrayContaining([
        "deploy",
        "--keep-vars",
        "--var",
        "LLM_ACTIVE_PROFILE:deepseek/deepseek-v4-flash",
        "--var",
        "LLM_MODEL_ID:deepseek-v4-flash",
      ]),
      expect.objectContaining({ cwd: workerDir }),
    );
  });

  it("上传 LLM API key secret 失败时给出清晰错误并提示 active 已更新", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi.fn().mockRejectedValueOnce(new Error("bulk failed"));

    await expect(
      deployProfile("deepseek/deepseek-v4-flash", {
        workerDir,
        runCommand,
      }),
    ).rejects.toThrow(
      "Failed to upload LLM API key secret after local active profile was set to deepseek/deepseek-v4-flash: bulk failed",
    );
  });

  it("删除旧的非敏感 LLM secrets 失败时给出清晰错误", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockResolvedValueOnce({
        stdout: JSON.stringify([{ name: "LLM_ACTIVE_PROFILE", type: "secret_text" }]),
        stderr: "",
      })
      .mockRejectedValueOnce(new Error("delete failed"));

    await expect(
      deployProfile("deepseek/deepseek-v4-flash", {
        workerDir,
        runCommand,
      }),
    ).rejects.toThrow(
      "Failed to delete legacy LLM secret LLM_ACTIVE_PROFILE after deploying profile deepseek/deepseek-v4-flash: delete failed",
    );
  });

  it("wrangler deploy 失败时给出清晰错误并提示 active 已更新", async () => {
    await writeFile(path.join(workerDir, "llm-profiles.local.jsonc"), VALID_PROFILES_JSONC, "utf8");

    const runCommand = vi
      .fn()
      .mockResolvedValueOnce({ stdout: "", stderr: "" })
      .mockRejectedValueOnce(new Error("deploy failed"));

    await expect(
      deployProfile("deepseek/deepseek-v4-flash", {
        workerDir,
        runCommand,
      }),
    ).rejects.toThrow(
      "Failed to run wrangler deploy after local active profile was set to deepseek/deepseek-v4-flash: deploy failed",
    );
  });
});
