import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InvestmentBriefingsPageClient } from "@/components/investment/investment-briefings-page-client";
import type { InvestmentBriefing } from "@/types/investment";

vi.mock("@/components/investment/investment-briefing-recommend-widget", () => ({
  InvestmentBriefingRecommendWidget: () => <div data-testid="investment-recommend-widget">investment-recommend-widget</div>,
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
    tags: ["投资每日简报"],
    published: true,
    content: "正文",
    readingTime: 2,
    relativePath: "2026-05-09-investment-daily-briefing.md",
    url: "/investment/daily-briefings/2026-05-09",
  },
  {
    slug: "2026-04-15",
    title: "投资简报 · 2026-04-15",
    date: "2026-04-15T00:00:00.000Z",
    year: "2026",
    month: "04",
    day: "15",
    brief: "更早摘要",
    excerpt: "更早摘要",
    tags: ["投资每日简报"],
    published: true,
    content: "正文",
    readingTime: 2,
    relativePath: "2026-04-15-investment-daily-briefing.md",
    url: "/investment/daily-briefings/2026-04-15",
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
          workerUrl: "/api/ai",
          turnstileSiteKey: "site-key",
          turnstileTimeoutMs: 20000,
          maxInputChars: 200,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "往期简报" })).toBeInTheDocument();
    expect(screen.getByText("（共 42 期）")).toBeInTheDocument();
    expect(screen.getByTestId("investment-recommend-widget")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 3 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 14 天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "近 30 天" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "全部" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "近 3 天" }));

    expect(screen.getByRole("link", { name: "查看归档" })).toBeInTheDocument();
  });
});
