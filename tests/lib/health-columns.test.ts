import { describe, expect, it } from "vitest";
import { getAllHealthColumnConfigs } from "@/lib/health-columns";

describe("health columns", () => {
  it("当前只保留喝出来的健康一个专栏", () => {
    expect(getAllHealthColumnConfigs()).toEqual([
      expect.objectContaining({
        slug: "drink-your-way-to-health",
        title: "喝出来的健康",
      }),
    ]);
  });
});
