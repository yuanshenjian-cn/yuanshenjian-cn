import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CoveragePageClient } from "@/components/investment/coverage-page-client";

const coverage = {
  title: "投资观察范围",
  intro: "固定观察名单为主，重大事件插播。",
  disclaimer: "本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。",
  methodCards: [
    { title: "怎么选内容", description: "先看可靠信息。" },
    { title: "怎么分区", description: "已确认动态与前瞻分栏。" },
    { title: "怎么控风险", description: "不提供买卖建议。" },
  ],
  boundaryStatements: ["不覆盖全市场。"],
  areas: [
    { name: "恒生科技", type: "index", priority: "core", publicSummary: "关注港股科技。", publicTags: ["港股"], sortOrder: 10 },
    { name: "消费", type: "sector", priority: "event-driven", publicSummary: "关注消费。", publicTags: ["消费"], sortOrder: 20 },
  ],
  companies: [
    { name: "腾讯控股", ticker: "0700.HK", market: "港股", priority: "core", publicSummary: "关注财报。", publicFocusPoints: ["财报"], sortOrder: 10 },
    { name: "英伟达", ticker: "NVDA", market: "美股", priority: "important", publicSummary: "关注指引。", publicFocusPoints: ["指引"], sortOrder: 20 },
  ],
} as const;

describe("CoveragePageClient", () => {
  it("支持优先级和市场轻量筛选", () => {
    render(<CoveragePageClient coverage={coverage} latestBriefingUrl="/investment/briefings/2026-05-09" />);

    expect(screen.getByRole("heading", { name: "投资观察范围" })).toBeInTheDocument();
    expect(screen.getByText("恒生科技")).toBeInTheDocument();
    expect(screen.getByText("腾讯控股")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "事件驱动" }));
    expect(screen.getAllByText("消费").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "美股" }));
    expect(screen.getByText("英伟达")).toBeInTheDocument();
    expect(screen.getByText("本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。"))
      .toBeInTheDocument();
  });

  it("查看往期简报跳转到往期简报页而不是归档页", () => {
    render(<CoveragePageClient coverage={coverage} latestBriefingUrl="/investment/briefings/2026-05-09" />);

    expect(screen.getByRole("link", { name: "查看往期简报" })).toHaveAttribute(
      "href",
      "/investment/briefings",
    );
  });
});
