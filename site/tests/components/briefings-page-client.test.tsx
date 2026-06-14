import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BriefingsPageClient } from "@/components/briefings/BriefingsPageClient";
import type { Briefing } from "@/types/briefing";

vi.mock("@/components/briefings/BriefingRecommendWidget", () => ({
  BriefingRecommendWidget: () => <div data-testid="recommend-widget">recommend-widget</div>,
}));

vi.mock("@/components/article/ArticleStatsBadge", () => ({
  ArticleStatsBadge: ({ slug }: { slug: string }) => <div data-testid={`stats-${slug}`}>stats-{slug}</div>,
}));

const briefings: Briefing[] = [
  {
    slug: "2026-05-08",
    title: "AI 简报 · 2026-05-08",
    date: new Date().toISOString(),
    year: "2026",
    month: "05",
    day: "08",
    excerpt: "今日摘要",
    tags: ["AI简报"],
    published: true,
    content: "正文",
    readingTime: 1,
    relativePath: "2026-05-08-ai-briefing.md",
    url: "/ai/briefings/2026-05-08",
  },
  {
    slug: "2026-05-01",
    title: "AI 简报 · 2026-05-01",
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    year: "2026",
    month: "05",
    day: "01",
    excerpt: "上周摘要",
    tags: ["AI简报"],
    published: true,
    content: "正文",
    readingTime: 1,
    relativePath: "2026-05-01-ai-briefing.md",
    url: "/ai/briefings/2026-05-01",
  },
];

describe("BriefingsPageClient", () => {
  it("在列表区域切换范围，同时不影响固定的推荐模块", () => {
    render(
      <BriefingsPageClient
        briefings={briefings}
        totalBriefings={19}
        aiConfig={{
          enabled: true,
          workerUrl: "/api/v1/ai-assistant",
          turnstileSiteKey: "site-key",
          turnstileTimeoutMs: 20000,
          maxInputChars: 200,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "往期简报" })).toBeInTheDocument();
    expect(screen.getByText("（共 19 期）")).toBeInTheDocument();
    expect(screen.getByTestId("recommend-widget")).toBeInTheDocument();
    expect(screen.getByTestId("stats-ai-briefing-2026-05-08")).toBeInTheDocument();
    expect(screen.getByTestId("stats-ai-briefing-2026-05-01")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "今天" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "近 3 天" }));

    expect(screen.getByRole("heading", { name: "往期简报" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "近 30 天" }));

    expect(screen.getByRole("heading", { name: "往期简报" })).toBeInTheDocument();
  });
});
