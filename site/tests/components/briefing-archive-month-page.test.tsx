import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/article/ArticleStatsBadge", () => ({
  ArticleStatsBadge: ({ slug }: { slug: string }) => <div data-testid={`stats-${slug}`}>stats-{slug}</div>,
}));

vi.mock("@/lib/briefings", () => ({
  getBriefingArchives: () => [{ year: "2026", month: "05" }],
  getBriefingsByMonth: () => [
    {
      slug: "2026-05-08",
      title: "AI 简报 · 2026-05-08",
      date: "2026-05-08T00:00:00.000Z",
      excerpt: "今日摘要",
      tags: ["AI简报"],
      url: "/ai/briefings/2026-05-08",
    },
  ],
}));

import BriefingArchiveMonthPage from "@/app/ai/briefings/archive/[year]/[month]/page";

describe("BriefingArchiveMonthPage", () => {
  it("为归档列表中的 AI 简报挂载只读统计组件", async () => {
    render(await BriefingArchiveMonthPage({ params: Promise.resolve({ year: "2026", month: "05" }) }));

    expect(screen.getByRole("heading", { name: "2026 年 05 月" })).toBeInTheDocument();
    expect(screen.getByTestId("stats-ai-briefing-2026-05-08")).toBeInTheDocument();
  });
});
