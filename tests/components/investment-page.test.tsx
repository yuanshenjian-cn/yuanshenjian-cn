import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/investment-config", () => ({
  getGeneratedInvestmentCoverageData: () => ({
    intro: "投资栏目说明",
    disclaimer: "仅供观察，不构成投资建议。",
  }),
}));

vi.mock("@/lib/investment-briefings", () => ({
  getLatestInvestmentBriefing: () => ({
    slug: "2026-05-09",
    title: "投资每日简报 · 2026-05-09",
    excerpt: "最新一期摘要",
    url: "/investment/daily-briefings/2026-05-09",
  }),
  getAllInvestmentBriefings: () => [{ slug: "2026-05-09" }],
}));

vi.mock("@/lib/investment-columns", () => ({
  getInvestmentColumns: () => [],
}));

import InvestmentPage from "@/app/investment/page";

describe("InvestmentPage", () => {
  it("移除重点观察公司/领域说明入口模块", async () => {
    render(await InvestmentPage());

    expect(screen.getByRole("heading", { name: "投资 · 简报 · 2026-05-09" })).toBeInTheDocument();
    expect(screen.getByText("最新一期摘要")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "阅读最新一期" })).toHaveAttribute("href", "/investment/daily-briefings/2026-05-09");
    expect(screen.queryByText("投资栏目说明")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "重点观察公司/领域说明入口" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "前往 coverage 说明页" })).not.toBeInTheDocument();
  });
});
