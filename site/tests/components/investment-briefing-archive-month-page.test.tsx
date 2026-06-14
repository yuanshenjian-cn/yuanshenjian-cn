import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/article/ArticleStatsBadge", () => ({
  ArticleStatsBadge: ({ slug }: { slug: string }) => <div data-testid={`stats-${slug}`}>stats-{slug}</div>,
}));

vi.mock("@/lib/investment-briefings", () => ({
  getInvestmentBriefingArchives: () => [{ year: "2026", month: "05" }],
  getInvestmentBriefingsByMonth: () => [
    {
      slug: "2026-05-09",
      title: "投资简报 · 2026-05-09",
      date: "2026-05-09T00:00:00.000Z",
      excerpt: "今日摘要",
      tags: ["投资简报"],
      url: "/investment/briefings/2026-05-09",
    },
  ],
}));

import InvestmentBriefingArchiveMonthPage from "@/app/investment/briefings/archive/[year]/[month]/page";

describe("InvestmentBriefingArchiveMonthPage", () => {
  it("为归档列表中的投资简报挂载只读统计组件", async () => {
    render(await InvestmentBriefingArchiveMonthPage({ params: Promise.resolve({ year: "2026", month: "05" }) }));

    expect(screen.getByRole("heading", { name: "2026 年 05 月" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-investment-briefing-2026-05-09")).toBeInTheDocument();
  });
});
