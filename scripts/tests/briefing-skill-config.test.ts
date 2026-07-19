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
  authority: string;
  coverageRole: "primary" | "supplemental" | "discovery";
  allowedArticleHosts: string[];
  allowedUrlPrefixes?: string[];
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

    expect(config.briefing.contentRulesV2EffectiveDate).toBe("2026-08-15");
    expect(config.briefing.windowStrategy).toBe("calendar-date-overlap");
    expect(config.briefing.initialLookbackDays).toBe(1);
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
      expect(["primary", "supplemental", "discovery"]).toContain(source.coverageRole);
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

  it("gives every priority company an official primary path", () => {
    const config = loadAiBriefingSkillConfig();
    for (const company of config.focusCompanies.filter((entry) => entry.priorityFocus)) {
      expect(
        config.sourceRegistry.sources.some(
          (source) =>
            source.companyId === company.id &&
            source.authority === "official" &&
            source.coverageRole === "primary" &&
            source.enabled,
        ),
      ).toBe(true);
    }
  });

  it("does not grant page sources blanket GitHub or Hugging Face authority", () => {
    const pageSources = loadAiBriefingSkillConfig().sourceRegistry.sources.filter(
      (source) => source.method === "page" && source.authority === "official",
    );

    for (const source of pageSources) {
      expect(source.allowedArticleHosts).not.toContain("github.com");
      expect(source.allowedArticleHosts).not.toContain("huggingface.co");
      expect(source.allowedUrlPrefixes?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("only documents registered sources as independent check paths", () => {
    const sourceMap = fs.readFileSync("skills/ai-briefing/references/source-map.md", "utf8");
    const section = sourceMap.match(
      /## Registry 中的独立路径([\s\S]*?)(?=\n## |$)/,
    )?.[1];
    expect(section).toBeTruthy();

    const documentedIds = [...(section ?? "").matchAll(/`([a-z0-9][a-z0-9-]+)`/g)].map(
      (match) => match[1],
    );
    const registeredIds = new Set(
      loadAiBriefingSkillConfig().sourceRegistry.sources.map((source) => source.id),
    );

    expect(documentedIds.length).toBeGreaterThan(0);
    for (const id of documentedIds) expect(registeredIds).toContain(id);
  });

  it("pins fast-xml-parser 5.10.0 in package metadata", () => {
    const packageJson = JSON.parse(fs.readFileSync("site/package.json", "utf8"));
    const packageLock = JSON.parse(fs.readFileSync("site/package-lock.json", "utf8"));

    expect(packageJson.dependencies["fast-xml-parser"]).toBe("5.10.0");
    expect(packageLock.packages["node_modules/fast-xml-parser"].version).toBe("5.10.0");
  });
});
