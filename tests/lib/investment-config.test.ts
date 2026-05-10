import { describe, expect, it } from "vitest";
import { getInvestmentCoverageProjection, getInvestmentToggles } from "@/lib/investment-config";

describe("investment config", () => {
  it("生成公开 coverage 投影时不会暴露私有字段", () => {
    const coverage = getInvestmentCoverageProjection();

    expect(coverage.title).toBe("投资观察范围");
    expect(coverage.areas[0]).not.toHaveProperty("aliases");
    expect(coverage.areas[0]).not.toHaveProperty("policySources");
    expect(coverage.companies[0]).not.toHaveProperty("mustCheck");
    expect(coverage.companies[0]).not.toHaveProperty("officialSources");
  });

  it("保留默认 toggle 配置", () => {
    const toggles = getInvestmentToggles();

    expect(toggles.enableConsensusExpectations).toBe(false);
    expect(toggles.enableRumorWatch).toBe(false);
    expect(toggles.enableMajorEventInsertion).toBe(true);
  });
});
