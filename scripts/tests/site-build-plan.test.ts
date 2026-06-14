import { beforeEach, describe, expect, it } from "vitest";

let buildPlan: (previousState: unknown, currentState: unknown) => {
  mode: "full" | "incremental";
  routes: {
    articles: string[];
    aiBriefings: string[];
    investmentBriefings: string[];
  };
  cleanup: {
    articleSlugs: string[];
    aiBriefingDates: string[];
    investmentBriefingDates: string[];
    aiArchiveMonths: string[];
    investmentArchiveMonths: string[];
  };
};

const baseState = {
  version: 1,
  generatedAt: "2026-06-14T00:00:00.000Z",
  sourceFingerprint: "same-source",
  content: {
    articles: [],
    aiBriefings: [],
    investmentBriefings: [],
  },
};

describe("site-build-plan script", () => {
  beforeEach(async () => {
    delete process.env.FORCE_FULL_SITE_BUILD;
    delete process.env.SITE_FULL_BUILD;
    ({ buildPlan } = await import("../site-build-plan.js"));
  });

  it("falls back to a full build without previous state", () => {
    const plan = buildPlan(null, baseState);

    expect(plan.mode).toBe("full");
    expect(plan.routes.articles).toEqual([]);
  });

  it("falls back to a full build when source files changed", () => {
    const plan = buildPlan(
      { ...baseState, sourceFingerprint: "old-source" },
      baseState,
    );

    expect(plan.mode).toBe("full");
  });

  it("plans incremental detail routes and stale output cleanup for content changes", () => {
    const previousState = {
      ...baseState,
      content: {
        articles: [
          { path: "content/blog/a.md", hash: "old-a", published: true, slug: "a" },
          { path: "content/blog/b.md", hash: "old-b", published: true, slug: "b" },
        ],
        aiBriefings: [
          { path: "content/ai-briefings/2026/05/2026-05-01-ai-briefing.md", hash: "old-ai", month: "2026-05", published: true, slug: "2026-05-01" },
        ],
        investmentBriefings: [
          { path: "content/investment-briefings/2026/05/2026-05-01-investment-briefing.md", hash: "old-investment", month: "2026-05", published: true, slug: "2026-05-01" },
        ],
      },
    };
    const currentState = {
      ...baseState,
      content: {
        articles: [
          { path: "content/blog/a.md", hash: "new-a", published: true, slug: "a" },
        ],
        aiBriefings: [
          { path: "content/ai-briefings/2026/05/2026-05-01-ai-briefing.md", hash: "new-ai", month: "2026-05", published: true, slug: "2026-05-01" },
        ],
        investmentBriefings: [],
      },
    };

    const plan = buildPlan(previousState, currentState);

    expect(plan.mode).toBe("incremental");
    expect(plan.routes.articles).toEqual(["a", "latest"]);
    expect(plan.routes.aiBriefings).toEqual(["2026-05-01", "latest"]);
    expect(plan.routes.investmentBriefings).toEqual([]);
    expect(plan.cleanup.articleSlugs).toEqual(["b"]);
    expect(plan.cleanup.investmentBriefingDates).toEqual(["2026-05-01"]);
    expect(plan.cleanup.investmentArchiveMonths).toEqual(["2026-05"]);
  });
});
