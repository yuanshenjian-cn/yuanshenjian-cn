import fs from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

interface SourceDefinition {
  id: string;
  companyId: string | null;
  publisherId: string;
  method: string;
  url?: string;
  queryTemplates?: string[];
  sourceTimezone: string;
  enabled: boolean;
}

interface AiBriefingConfig {
  briefing: Record<string, unknown>;
  focusCompanies: Array<{ id: string; priorityFocus: boolean }>;
  sourceRegistry: { version: number; sources: SourceDefinition[] };
  generatorResultSchema: Record<string, unknown>;
  reviewerResultSchema: Record<string, unknown>;
}

let loadAiBriefingSkillConfig: () => AiBriefingConfig;

beforeAll(async () => {
  ({ loadAiBriefingSkillConfig } = await import("../briefing-skill-config.js"));
});

describe("AI briefing machine configuration", () => {
  it("loads the complete configuration", () => {
    const config = loadAiBriefingSkillConfig();

    expect(config.briefing.contentRulesV2EffectiveDate).toBe("2026-07-15");
    expect(config.sourceRegistry.version).toBe(1);
    expect(config.generatorResultSchema.anyOf).toBeInstanceOf(Array);
    expect(config.reviewerResultSchema.anyOf).toBeInstanceOf(Array);
  });

  it("defines unique and safe registry sources", () => {
    const { sources } = loadAiBriefingSkillConfig().sourceRegistry;
    const ids = sources.map((source) => source.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const source of sources) {
      expect(source.publisherId).not.toBe("");
      expect(() => new Intl.DateTimeFormat("en-US", { timeZone: source.sourceTimezone })).not.toThrow();
      if (source.enabled && source.url) {
        expect(new URL(source.url).protocol).toBe("https:");
      }
    }
  });

  it("contains the required first-party, feed, and media source ids", () => {
    const ids = new Set(loadAiBriefingSkillConfig().sourceRegistry.sources.map((source) => source.id));
    const requiredIds = [
      "openai-news-rss",
      "google-ai-rss",
      "google-deepmind-rss",
      "google-research-rss",
      "meta-newsroom-rss",
      "openai-python-releases",
      "anthropic-python-releases",
      "google-genai-python-releases",
      "techcrunch-ai-rss",
      "the-verge-ai-rss",
      "openai-api-changelog",
      "anthropic-news",
      "google-gemini-api-changelog",
      "xai-news",
      "meta-ai",
      "perplexity-changelog",
      "mistral-news",
      "kimi-blog",
      "mimo-home",
      "mimo-hugging-face",
      "deepseek-news",
      "zhipu-news",
      "minimax-news",
      "reuters-media-search",
      "bloomberg-media-search",
      "36kr-media-search",
    ];

    for (const id of requiredIds) expect(ids).toContain(id);
  });

  it("gives every priority company an official non-search path and a search fallback", () => {
    const config = loadAiBriefingSkillConfig();
    const genericSearchSources = config.sourceRegistry.sources.filter(
      (source) => source.method === "search" && source.companyId === null && source.queryTemplates?.length,
    );

    expect(genericSearchSources.length).toBeGreaterThan(0);
    for (const company of config.focusCompanies.filter((entry) => entry.priorityFocus)) {
      expect(
        config.sourceRegistry.sources.some(
          (source) => source.companyId === company.id && source.method !== "search",
        ),
      ).toBe(true);
    }
  });

  it("pins fast-xml-parser 5.10.0 in package metadata", () => {
    const packageJson = JSON.parse(fs.readFileSync("site/package.json", "utf8"));
    const packageLock = JSON.parse(fs.readFileSync("site/package-lock.json", "utf8"));

    expect(packageJson.dependencies["fast-xml-parser"]).toBe("5.10.0");
    expect(packageLock.packages["node_modules/fast-xml-parser"].version).toBe("5.10.0");
  });
});
