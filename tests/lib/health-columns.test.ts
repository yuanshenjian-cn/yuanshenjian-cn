import { describe, expect, it } from "vitest";
import { getAllHealthColumnConfigs } from "@/lib/health-columns";

describe("health columns", () => {
  it("包含喝出来的健康和吃出来的健康两个专栏", () => {
    const configs = getAllHealthColumnConfigs();
    expect(configs).toHaveLength(2);
    expect(configs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: "drink-your-way-to-health",
          title: "喝出来的健康",
        }),
        expect.objectContaining({
          slug: "eat-your-way-to-health",
          title: "吃出来的健康",
        }),
      ]),
    );
  });
});
