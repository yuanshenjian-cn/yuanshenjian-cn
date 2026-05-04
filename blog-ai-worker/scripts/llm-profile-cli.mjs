import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import supportedProviders from "../supported-llm-providers.json" with { type: "json" };

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE);
const DEFAULT_WORKER_DIR = resolve(SCRIPT_DIR, "..");
const PROFILES_FILENAME = "llm-profiles.local.jsonc";
const ACTIVE_PROFILE_FILENAME = ".llm-active-profile";
const SUPPORTED_CONFIG_VERSION = 1;
const SUPPORTED_LLM_PROVIDERS = supportedProviders;

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function createPaths(options = {}) {
  const workerDir = resolve(options.workerDir ?? DEFAULT_WORKER_DIR);

  return {
    workerDir,
    profilesFile: options.profilesFile ?? join(workerDir, PROFILES_FILENAME),
    activeFile: options.activeFile ?? join(workerDir, ACTIVE_PROFILE_FILENAME),
  };
}

function assertNonEmptyString(value, path) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${path} is required`);
  }

  return value.trim();
}

function isSupportedLLMProvider(providerName) {
  return SUPPORTED_LLM_PROVIDERS.includes(providerName);
}

function formatBaseUrlForOutput(baseUrl) {
  try {
    return new URL(baseUrl).origin;
  } catch {
    return "(invalid origin)";
  }
}

function stripJsonComments(source) {
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  let isEscaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (inLineComment) {
      if (character === "\n") {
        inLineComment = false;
        result += character;
      }
      continue;
    }

    if (inBlockComment) {
      if (character === "*" && nextCharacter === "/") {
        inBlockComment = false;
        index += 1;
      } else if (character === "\n") {
        result += character;
      }
      continue;
    }

    if (inString) {
      result += character;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (character === "\\") {
        isEscaped = true;
        continue;
      }

      if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character === "/" && nextCharacter === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (character === "/" && nextCharacter === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    result += character;
  }

  return result;
}

function stripTrailingCommas(source) {
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (const character of source) {
    if (inString) {
      result += character;

      if (isEscaped) {
        isEscaped = false;
      } else if (character === "\\") {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }

      continue;
    }

    if (character === '"') {
      inString = true;
      result += character;
      continue;
    }

    if (character === "}" || character === "]") {
      let lastIndex = result.length - 1;
      while (lastIndex >= 0 && /\s/.test(result[lastIndex])) {
        lastIndex -= 1;
      }

      if (result[lastIndex] === ",") {
        result = `${result.slice(0, lastIndex)}${result.slice(lastIndex + 1)}`;
      }
    }

    result += character;
  }

  return result;
}

export function parseJsonc(source) {
  return JSON.parse(stripTrailingCommas(stripJsonComments(source)));
}

export function parseProfileSelector(selector) {
  if (typeof selector !== "string" || !selector.trim()) {
    throw new Error("Profile selector is required. Use provider/modelKey.");
  }

  const normalized = selector.trim();
  const segments = normalized.split("/");

  if (segments.length !== 2 || !segments[0] || !segments[1]) {
    throw new Error(`Invalid profile selector "${normalized}". Use provider/modelKey.`);
  }

  return {
    raw: normalized,
    providerName: segments[0],
    modelKey: segments[1],
  };
}

export function normalizeProfilesConfig(config) {
  if (!isRecord(config)) {
    throw new Error("Root config must be an object");
  }

  if (config.version !== SUPPORTED_CONFIG_VERSION) {
    throw new Error(`version must be ${SUPPORTED_CONFIG_VERSION}`);
  }

  if (!isRecord(config.providers)) {
    throw new Error("providers must be an object");
  }

  const profiles = [];

  for (const [providerName, providerConfig] of Object.entries(config.providers)) {
    if (!providerName || providerName.includes("/")) {
      throw new Error(`providers.${providerName || "<empty>"} must be a valid provider key`);
    }

    if (!isRecord(providerConfig)) {
      throw new Error(`providers.${providerName} must be an object`);
    }

    const label =
      typeof providerConfig.label === "string" && providerConfig.label.trim()
        ? providerConfig.label.trim()
        : undefined;
    const baseUrl = assertNonEmptyString(providerConfig.baseUrl, `providers.${providerName}.baseUrl`);
    const apiKey = assertNonEmptyString(providerConfig.apiKey, `providers.${providerName}.apiKey`);

    if (!isRecord(providerConfig.models)) {
      throw new Error(`providers.${providerName}.models must be an object`);
    }

    for (const [modelKey, modelConfig] of Object.entries(providerConfig.models)) {
      if (!modelKey || modelKey.includes("/")) {
        throw new Error(`providers.${providerName}.models.${modelKey || "<empty>"} must be a valid model key`);
      }

      if (!isRecord(modelConfig)) {
        throw new Error(`providers.${providerName}.models.${modelKey} must be an object`);
      }

      const modelId = assertNonEmptyString(
        modelConfig.modelId,
        `providers.${providerName}.models.${modelKey}.modelId`,
      );

      profiles.push({
        selector: `${providerName}/${modelKey}`,
        providerName,
        providerLabel: label,
        modelKey,
        modelId,
        baseUrl,
        apiKey,
      });
    }
  }

  return {
    version: SUPPORTED_CONFIG_VERSION,
    profiles,
  };
}

export async function loadProfilesConfig(options = {}) {
  const { profilesFile } = createPaths(options);
  const read = options.readFile ?? readFile;

  let source;

  try {
    source = await read(profilesFile, "utf8");
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      throw new Error(
        `${basename(profilesFile)} is missing. Copy llm-profiles.example.jsonc to ${PROFILES_FILENAME} first.`,
      );
    }

    throw error;
  }

  let parsed;

  try {
    parsed = parseJsonc(source);
  } catch {
    throw new Error(`${basename(profilesFile)} is not valid JSONC`);
  }

  return normalizeProfilesConfig(parsed);
}

export function resolveProfile(config, selector) {
  const { raw } = parseProfileSelector(selector);
  const profile = config.profiles.find((item) => item.selector === raw);

  if (!profile) {
    throw new Error(`Unknown profile: ${raw}`);
  }

  return profile;
}

export function assertSupportedProfile(profile) {
  if (!isSupportedLLMProvider(profile.providerName)) {
    throw new Error(
      `Unsupported provider in profile ${profile.selector}: ${profile.providerName}. Implement it in blog-ai-worker/src/providers/index.ts first.`,
    );
  }

  return profile;
}

export async function readActiveProfile(options = {}) {
  const { activeFile } = createPaths(options);
  const read = options.readFile ?? readFile;

  let source;

  try {
    source = await read(activeFile, "utf8");
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") {
      if (options.allowMissing) {
        return null;
      }

      throw new Error(
        `${basename(activeFile)} is missing. Run npm run llm:use -- provider/modelKey or npm run llm:deploy -- provider/modelKey first.`,
      );
    }

    throw error;
  }

  try {
    return parseProfileSelector(source.trim()).raw;
  } catch {
    throw new Error(`${basename(activeFile)} is invalid. Re-run npm run llm:use -- provider/modelKey.`);
  }
}

export async function writeActiveProfile(selector, options = {}) {
  const { activeFile } = createPaths(options);
  const write = options.writeFile ?? writeFile;
  const normalized = parseProfileSelector(selector).raw;

  await write(activeFile, `${normalized}\n`, "utf8");
  return normalized;
}

function buildSecretPayload(profile) {
  return {
    LLM_ACTIVE_PROFILE: profile.selector,
    LLM_PROVIDER_NAME: profile.providerName,
    LLM_MODEL_ID: profile.modelId,
    LLM_PROVIDER_BASE_URL: profile.baseUrl,
    LLM_PROVIDER_API_KEY: profile.apiKey,
  };
}

async function runCommand(command, args, options = {}) {
  const input = options.input ?? null;

  return await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }

      reject(new Error(stderr.trim() || `${command} ${args.join(" ")} failed with exit code ${code}`));
    });

    if (input === null) {
      child.stdin.end();
      return;
    }

    child.stdin.end(input);
  });
}

export async function listProfiles(options = {}) {
  const config = await loadProfilesConfig(options);
  const activeProfile = await readActiveProfile({ ...options, allowMissing: true });

  return {
    activeProfile,
    profiles: config.profiles,
  };
}

export async function useProfile(selector, options = {}) {
  const config = await loadProfilesConfig(options);
  const profile = assertSupportedProfile(resolveProfile(config, selector));

  await writeActiveProfile(profile.selector, options);
  return profile;
}

export async function deployProfile(selector, options = {}) {
  const config = await loadProfilesConfig(options);
  const paths = createPaths(options);
  const execute = options.runCommand ?? runCommand;

  let activeSelector;

  if (selector) {
    const profile = assertSupportedProfile(resolveProfile(config, selector));
    activeSelector = await writeActiveProfile(profile.selector, options);
  } else {
    activeSelector = await readActiveProfile(options);
  }

  const profile = assertSupportedProfile(resolveProfile(config, activeSelector));
  const payload = JSON.stringify(buildSecretPayload(profile), null, 2);

  try {
    await execute("wrangler", ["secret", "bulk"], {
      cwd: paths.workerDir,
      input: payload,
    });
  } catch (error) {
    throw new Error(
      `Failed to upload LLM secrets with wrangler secret bulk after local active profile was set to ${profile.selector}: ${getErrorMessage(error)}`,
    );
  }

  try {
    await execute("wrangler", ["deploy"], {
      cwd: paths.workerDir,
    });
  } catch (error) {
    throw new Error(
      `Failed to run wrangler deploy after local active profile was set to ${profile.selector}: ${getErrorMessage(error)}`,
    );
  }

  return profile;
}

function printUsage(writeLine) {
  writeLine("Usage:");
  writeLine("  npm run llm:list");
  writeLine("  npm run llm:use -- provider/modelKey");
  writeLine("  npm run llm:deploy -- provider/modelKey");
  writeLine("  npm run llm:deploy");
}

export async function main(argv = process.argv.slice(2), options = {}) {
  const writeLine = options.writeLine ?? console.log;
  const [command, selector, extra] = argv;

  if (!command || command === "-h" || command === "--help") {
    printUsage(writeLine);
    return;
  }

  if (extra !== undefined) {
    throw new Error("Too many arguments. Use a single provider/modelKey selector.");
  }

  if (command === "list") {
    const result = await listProfiles(options);

    writeLine(result.activeProfile ? `Current active profile: ${result.activeProfile}` : "Current active profile: (none)");
    for (const profile of result.profiles) {
      const activeMarker = profile.selector === result.activeProfile ? "*" : "-";
      writeLine(
        `${activeMarker} ${profile.selector} | provider=${profile.providerName} | modelId=${profile.modelId} | baseUrlOrigin=${formatBaseUrlForOutput(profile.baseUrl)}`,
      );
    }
    return;
  }

  if (command === "use") {
    const profile = await useProfile(selector, options);

    writeLine(`Active profile saved: ${profile.selector}`);
    writeLine(`Provider: ${profile.providerName}`);
    writeLine(`Model ID: ${profile.modelId}`);
    writeLine(`Base URL origin: ${formatBaseUrlForOutput(profile.baseUrl)}`);
    return;
  }

  if (command === "deploy") {
    const profile = await deployProfile(selector, options);

    writeLine(`Deployed Worker with profile: ${profile.selector}`);
    writeLine(`Provider: ${profile.providerName}`);
    writeLine(`Model ID: ${profile.modelId}`);
    writeLine(`Base URL origin: ${formatBaseUrlForOutput(profile.baseUrl)}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (resolve(process.argv[1] ?? "") === SCRIPT_FILE) {
  main().catch((error) => {
    console.error(getErrorMessage(error));
    process.exitCode = 1;
  });
}
