import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearInvestmentBriefingsCache,
  getAdjacentInvestmentBriefings,
  getAllInvestmentBriefings,
  getInvestmentBriefingArchives,
  getInvestmentBriefingBySlug,
  getInvestmentBriefingsByMonth,
  getLatestInvestmentBriefing,
  getRecentInvestmentBriefings,
} from "@/lib/investment-briefings";

const briefingsDir = path.join(process.cwd(), "content", "investment-briefings");
const testFiles = [
  path.join(briefingsDir, "2099-01-02-investment-daily-briefing.md"),
  path.join(briefingsDir, "2099-01-01-investment-daily-briefing.md"),
  path.join(briefingsDir, "2098-12-31-investment-daily-briefing.md"),
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
  - 投资
  - 腾讯控股
  - 港股科技
---

## 近 24 小时确认动态

${title} 已确认动态。

## 未来重点观察

${title} 未来重点观察。

## 来源

- https://example.com/${date}

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
  );
}

describe("investment briefings data layer", () => {
  beforeEach(() => {
    fs.mkdirSync(briefingsDir, { recursive: true });
    writeBriefing(testFiles[0], "投资简报 2", "2099-01-02");
    writeBriefing(testFiles[1], "投资简报 1", "2099-01-01");
    writeBriefing(testFiles[2], "投资简报 0", "2098-12-31");
    clearInvestmentBriefingsCache();
  });

  afterEach(() => {
    for (const file of testFiles) {
      fs.rmSync(file, { force: true });
    }
    clearInvestmentBriefingsCache();
  });

  it("按日期倒序读取已发布投资简报", () => {
    const briefings = getAllInvestmentBriefings().filter((briefing) => briefing.slug.startsWith("2099-01-"));

    expect(briefings.map((briefing) => briefing.slug)).toEqual(["2099-01-02", "2099-01-01"]);
    expect(getLatestInvestmentBriefing()?.slug).toBe("2099-01-02");
  });

  it("支持 slug 查询、相邻简报与最近列表", () => {
    const briefing = getInvestmentBriefingBySlug("2099-01-01");
    const adjacent = getAdjacentInvestmentBriefings("2099-01-01");
    const recent = getRecentInvestmentBriefings(2);

    expect(briefing?.title).toBe("投资简报 1");
    expect(adjacent.next?.slug).toBe("2099-01-02");
    expect(adjacent.prev?.slug).toBe("2098-12-31");
    expect(recent.map((item) => item.slug)).toEqual(["2099-01-02", "2099-01-01"]);
  });

  it("支持归档与按月过滤", () => {
    const archives = getInvestmentBriefingArchives().filter((item) => item.year === "2099" || item.year === "2098");
    const januaryBriefings = getInvestmentBriefingsByMonth("2099", "01");
    const decemberBriefings = getInvestmentBriefingsByMonth("2098", "12");

    expect(archives).toEqual([
      expect.objectContaining({ year: "2099", month: "01", count: 2, url: "/investment/daily-briefings/archive/2099/01" }),
      expect.objectContaining({ year: "2098", month: "12", count: 1, url: "/investment/daily-briefings/archive/2098/12" }),
    ]);
    expect(januaryBriefings.map((item) => item.slug)).toEqual(["2099-01-02", "2099-01-01"]);
    expect(decemberBriefings.map((item) => item.slug)).toEqual(["2098-12-31"]);
  });
});
