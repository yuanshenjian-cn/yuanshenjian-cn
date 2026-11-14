import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearBriefingsCache,
  getAdjacentBriefings,
  getAllBriefings,
  getBriefingArchives,
  getBriefingBySlug,
  getBriefingsByMonth,
  getBriefingsByRange,
  getRecentBriefings,
} from "@/lib/briefings";
import { aiBriefingsDir } from "@/lib/workspace-paths";

const briefingsDir = aiBriefingsDir;
const testFiles = [
  path.join(briefingsDir, "2077-01-02-ai-briefing-test.md"),
  path.join(briefingsDir, "2077-01-01-ai-briefing-test.md"),
  path.join(briefingsDir, "2076-12-31-ai-briefing-test.md"),
];

function writeBriefing(filePath: string, title: string, date: string) {
  fs.writeFileSync(
    filePath,
    `---
title: "${title}"
date: "${date}"
brief: "${title} 摘要"
published: true
tags:
  - AI
---

## 速览

${title} 正文。`,
  );
}

describe("briefings data layer", () => {
  beforeEach(() => {
    fs.mkdirSync(briefingsDir, { recursive: true });
    writeBriefing(testFiles[0], "测试简报 2", "2077-01-02");
    writeBriefing(testFiles[1], "测试简报 1", "2077-01-01");
    writeBriefing(testFiles[2], "测试简报 0", "2076-12-31");
    clearBriefingsCache();
  });

  afterEach(() => {
    for (const file of testFiles) {
      fs.rmSync(file, { force: true });
    }
    clearBriefingsCache();
  });

  it("按日期倒序读取已发布简报", () => {
    const briefings = getAllBriefings().filter((briefing) => briefing.slug.startsWith("2077-01-"));

    expect(briefings.map((briefing) => briefing.slug)).toEqual([
      "2077-01-02",
      "2077-01-01",
    ]);
    // 只在本用例的日期子集内比较，避免内容目录里其他归档文件影响「最新」判定
    expect(briefings[0]?.slug).toBe("2077-01-02");
  });

  it("支持 slug 查询、相邻简报和日期范围过滤", () => {
    const briefing = getBriefingBySlug("2077-01-01");
    const adjacent = getAdjacentBriefings("2077-01-01");
    const ranged = getBriefingsByRange("3d", new Date("2077-01-02T12:00:00.000Z"));

    expect(briefing?.title).toBe("测试简报 1");
    expect(adjacent.next?.slug).toBe("2077-01-02");
    expect(ranged.some((item) => item.slug === "2077-01-01")).toBe(true);
  });

  it("支持最近 30 天、月份归档与按月过滤", () => {
    const expected = ["2077-01-02", "2077-01-01", "2076-12-31"];
    const recent = getRecentBriefings(30, new Date("2077-01-02T12:00:00.000Z")).filter((item) =>
      expected.includes(item.slug),
    );
    const archives = getBriefingArchives().filter((item) => item.year === "2077" || item.year === "2076");
    const januaryBriefings = getBriefingsByMonth("2077", "01");
    const decemberBriefings = getBriefingsByMonth("2076", "12");

    expect(recent.map((item) => item.slug)).toEqual(expected);
    expect(archives).toEqual([
      expect.objectContaining({ year: "2077", month: "01", count: 2, url: "/ai/briefings/archive/2077/01" }),
      expect.objectContaining({ year: "2076", month: "12", count: 1, url: "/ai/briefings/archive/2076/12" }),
    ]);
    expect(januaryBriefings.map((item) => item.slug)).toEqual(["2077-01-02", "2077-01-01"]);
    expect(decemberBriefings.map((item) => item.slug)).toEqual(["2076-12-31"]);
  });
});
