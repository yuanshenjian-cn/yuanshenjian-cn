import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/health-columns", () => ({
  getHealthColumns: () => [
    {
      slug: "drink-your-way-to-health",
      title: "喝出来的健康",
      description: "健康饮品与饮水习惯专栏",
      posts: [],
    },
  ],
}));

import HealthPage from "@/app/health/page";

describe("HealthPage", () => {
  it("展示健康栏目和喝出来的健康专栏入口", async () => {
    render(await HealthPage());

    expect(screen.getByRole("heading", { name: "健康栏目" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /喝出来的健康/ })).toHaveAttribute(
      "href",
      "/health/drink-your-way-to-health",
    );
  });
});
