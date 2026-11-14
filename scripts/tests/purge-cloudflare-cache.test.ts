import { beforeAll, describe, expect, it } from "vitest";

let buildAiBriefingPurgePaths: (date: string) => string[];
let buildArticlePurgePaths: (slug: string, articlePageCount?: number) => string[];
let buildInvestmentBriefingPurgePaths: (date: string) => string[];
let buildInvestmentCoveragePaths: () => string[];
let buildToolsPurgePaths: (slugs: string[]) => string[];
let getRegisteredToolSlugs: () => string[];
let getArticleSectionPaths: (filePath: string) => string[];
let buildTargetUrls: (options: {
  changedFiles: string[];
  date: string | null;
  dryRun: boolean;
  help: boolean;
  scope: string | null;
  siteUrl: string | null;
  slug: string | null;
  urls: string[];
}) => string[];
let derivePurgePathsFromChangedFiles: (changedFiles: string[], options?: { articlePageCount?: number }) => string[];

describe("purge-cloudflare-cache script", () => {
  beforeAll(async () => {
    ({
      buildAiBriefingPurgePaths,
      buildArticlePurgePaths,
      buildInvestmentBriefingPurgePaths,
      buildInvestmentCoveragePaths,
      buildTargetUrls,
      buildToolsPurgePaths,
      derivePurgePathsFromChangedFiles,
      getArticleSectionPaths,
      getRegisteredToolSlugs,
    } = await import("../purge-cloudflare-cache.js"));
  });

  it("builds AI briefing purge paths with latest, archive and detail routes", () => {
    const paths = buildAiBriefingPurgePaths("2026-05-26");

    expect(paths).toContain("/");
    expect(paths).toContain("/ai");
    expect(paths).toContain("/ai/briefings/latest");
    expect(paths).toContain("/ai/briefings/archive/2026/05");
    expect(paths).toContain("/ai/briefings/2026-05-26");
    expect(paths).toContain("/ai-data/briefings/index.json");
  });

  it("builds investment briefing purge paths with coverage and detail routes", () => {
    const paths = buildInvestmentBriefingPurgePaths("2026-05-26");

    expect(paths).toContain("/");
    expect(paths).toContain("/investment");
    expect(paths).toContain("/investment/briefings/latest");
    expect(paths).toContain("/investment/coverage");
    expect(paths).toContain("/investment/briefings/archive/2026/05");
    expect(paths).toContain("/investment-data/briefings/index.json");
    expect(paths).not.toContain("/investment-data/coverage.json");
  });

  it("builds standalone investment coverage purge paths", () => {
    const paths = buildInvestmentCoveragePaths();

    expect(paths).toEqual([
      "/investment/coverage",
      "/investment-data/coverage.json",
    ]);
  });

  it("builds tools purge paths with list, detail and embed routes", () => {
    const paths = buildToolsPurgePaths(["pomodoro", "mortgage"]);

    expect(paths).toContain("/tools");
    expect(paths).toContain("/sitemap.xml");
    expect(paths).toContain("/tools/pomodoro");
    expect(paths).toContain("/tools/pomodoro/view.html");
    expect(paths).toContain("/tools/mortgage");
    expect(paths).toContain("/tools/mortgage/view.html");
  });

  it("derives tools purge targets from registry and tool asset changes", () => {
    const registryPaths = derivePurgePathsFromChangedFiles(["site/data/tools.json"], {
      articlePageCount: 2,
    });

    expect(registryPaths).toContain("/tools");
    expect(registryPaths).toContain("/sitemap.xml");
    for (const slug of getRegisteredToolSlugs()) {
      expect(registryPaths).toContain(`/tools/${slug}`);
      expect(registryPaths).toContain(`/tools/${slug}/view.html`);
    }

    const assetPaths = derivePurgePathsFromChangedFiles([
      "site/public/tools/example-tool/view.html",
      "site/public/tools/example-tool/img/demo.png",
    ], { articlePageCount: 2 });

    expect(assetPaths).toContain("/tools");
    expect(assetPaths).toContain("/tools/example-tool");
    expect(assetPaths).toContain("/tools/example-tool/view.html");
  });

  it("derives all tools purge targets from tools UI source changes", () => {
    const paths = derivePurgePathsFromChangedFiles([
      "site/components/tools/ToolDirectory.tsx",
    ], { articlePageCount: 2 });

    expect(paths).toContain("/tools");
    for (const slug of getRegisteredToolSlugs()) {
      expect(paths).toContain(`/tools/${slug}`);
    }
  });

  it("builds article purge paths with listing, feed and pagination routes", () => {
    const paths = buildArticlePurgePaths("opencode-efficiency-config-handbook", 3);

    expect(paths).toContain("/");
    expect(paths).toContain("/articles");
    expect(paths).toContain("/articles/latest");
    expect(paths).toContain("/articles/opencode-efficiency-config-handbook");
    expect(paths).toContain("/articles/page/2");
    expect(paths).toContain("/articles/page/3");
    expect(paths).toContain("/feed");
    expect(paths).toContain("/ai-data/articles/opencode-efficiency-config-handbook.json");
  });

  it("derives section-level purge targets for AI, investment and health articles", () => {
    expect(getArticleSectionPaths("content/blog/swd/ai-coding/opencode/opencode-efficiency-config-handbook.md")).toEqual([
      "/ai",
      "/ai/opencode",
    ]);

    expect(getArticleSectionPaths("content/blog/investment/beginner-investing/example.md")).toEqual([
      "/investment",
      "/investment/beginner-investing",
    ]);

    expect(getArticleSectionPaths("content/blog/health/eat-your-way-to-health/example.md")).toEqual([
      "/health",
      "/health/eat-your-way-to-health",
    ]);
  });

  it("derives purge targets from changed content files", () => {
    const paths = derivePurgePathsFromChangedFiles([
      "content/ai-briefings/2026/05/2026-05-26-ai-briefing.md",
      "content/investment-briefings/2026/05/2026-05-26-investment-briefing.md",
      "content/blog/swd/ai-coding/opencode/opencode-efficiency-config-handbook.md",
    ], { articlePageCount: 2 });

    expect(paths).toContain("/ai/briefings/2026-05-26");
    expect(paths).toContain("/investment/briefings/2026-05-26");
    expect(paths).toContain("/articles/opencode-efficiency-config-handbook");
    expect(paths).toContain("/articles/page/2");
    expect(paths).toContain("/ai");
    expect(paths).toContain("/ai/opencode");
    expect(paths).not.toContain("/investment-data/coverage.json");
  });

  it("derives standalone coverage purge targets from coverage-related source files", () => {
    const paths = derivePurgePathsFromChangedFiles([
      "skills/investment-briefing/config/focus-areas.json",
    ], { articlePageCount: 2 });

    expect(paths).toEqual([
      "/investment-data/coverage.json",
      "/investment/coverage",
    ]);
  });

  it("builds absolute URLs from derived paths and explicit URLs", () => {
    const urls = buildTargetUrls({
      changedFiles: ["content/ai-briefings/2026/05/2026-05-26-ai-briefing.md"],
      date: null,
      dryRun: false,
      help: false,
      scope: "deploy",
      siteUrl: "https://example.com",
      slug: null,
      urls: ["/custom-path", "https://mirror.example.com/keep-me"],
    });

    expect(urls).toContain("https://example.com/");
    expect(urls).toContain("https://example.com/ai/briefings/latest");
    expect(urls).toContain("https://example.com/custom-path");
    expect(urls).toContain("https://mirror.example.com/keep-me");
  });
});
