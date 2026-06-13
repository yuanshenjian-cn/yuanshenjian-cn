import { describe, expect, it } from "vitest";

import { buildAdvisorContext, defaultAdvisorQuickTopics, resolveAdvisorDomainByPath } from "@/lib/advisor-context";

describe("advisor-context", () => {
  it("should resolve advisor domain by article path", () => {
    expect(resolveAdvisorDomainByPath("health/eat-your-way-to-health/post.md")).toBe("health");
    expect(resolveAdvisorDomainByPath("investment/beginner-investing/post.md")).toBe("investment");
    expect(resolveAdvisorDomainByPath("swd/ai-coding/opencode/post.md")).toBe("ai");
    expect(resolveAdvisorDomainByPath("essays/random-post.md")).toBe("article");
  });

  it("should build article advisor context with quick topics", () => {
    const context = buildAdvisorContext({
      scene: "article",
      title: "测试文章",
      domain: "ai",
      pageSlug: "test-article",
      articleSlug: "test-article",
      quickTopics: defaultAdvisorQuickTopics("article"),
    });

    expect(context.scene).toBe("article");
    expect(context.pageTitle).toBe("测试文章");
    expect(context.domain).toBe("ai");
    expect(context.quickTopics.length).toBeGreaterThan(0);
  });
});
