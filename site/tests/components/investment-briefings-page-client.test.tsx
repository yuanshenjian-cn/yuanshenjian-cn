import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestmentBriefingsPageClient } from "@/components/investment/InvestmentBriefingsPageClient";
import type { InvestmentBriefing } from "@/types/investment";

vi.mock("@/components/investment/InvestmentBriefingRecommendWidget", () => ({
  InvestmentBriefingRecommendWidget: () => <div data-testid="investment-recommend-widget">investment-recommend-widget</div>,
}));

vi.mock("@/components/article/ArticleStatsBadge", () => ({
  ArticleStatsBadge: ({ slug }: { slug: string }) => <div data-testid={`stats-${slug}`}>stats-{slug}</div>,
}));

const briefings: InvestmentBriefing[] = [
  {
    slug: "2026-05-09",
    title: "投资简报 · 2026-05-09",
    date: new Date().toISOString(),
    year: "2026",
    month: "05",
    day: "09",
    brief: "今日摘要",
    excerpt: "今日摘要",
    tags: ["投资简报"],
    published: true,
    content: "正文",
    readingTime: 2,
    relativePath: "2026-05-09-investment-briefing.md",
    url: "/investment/briefings/2026-05-09",
  },
  {
    slug: "2026-04-15",
    title: "投资简报 · 2026-04-15",
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    year: "2026",
    month: "04",
    day: "15",
    brief: "更早摘要",
    excerpt: "更早摘要",
    tags: ["投资简报"],
    published: true,
    content: "正文",
    readingTime: 2,
    relativePath: "2026-04-15-investment-briefing.md",
    url: "/investment/briefings/2026-04-15",
  },
];

describe("InvestmentBriefingsPageClient", () => {
  it("切换时间范围并保留归档入口", () => {
    render(
      <InvestmentBriefingsPageClient
        briefings={briefings}
        totalBriefings={42}
        hasOlderBriefings
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
    expect(screen.getByText("（共 42 期）")).toBeInTheDocument();
    expect(screen.getByTestId("investment-recommend-widget")).toBeInTheDocument();
    expect(screen.getByTestId("stats-investment-briefing-2026-05-09")).toBeInTheDocument();
    expect(screen.getByTestId("stats-investment-briefing-2026-04-15")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 3 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 14 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "全部" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "近 3 天" }));

    expect(screen.getByRole("link", { name: "查看归档" })).toBeInTheDocument();
  });
});
