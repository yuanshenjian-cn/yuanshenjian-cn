import { describe, expect, it } from "vitest";
import { getAllInvestmentColumnConfigs } from "@/lib/investment-columns";

describe("investment columns", () => {
  it("当前只保留小白学投资一个专栏", () => {
    expect(getAllInvestmentColumnConfigs()).toEqual([
      expect.objectContaining({
        slug: "beginner-investing",
        title: "小白学投资",
      }),
    ]);
  });
});
