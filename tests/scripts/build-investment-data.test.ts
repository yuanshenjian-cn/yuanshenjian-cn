import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let buildBriefingsPayload: () => { items: Array<{ slug: string; title: string; brief: string; url: string }> };
let buildCoveragePayload: () => { areas: Array<Record<string, unknown>>; companies: Array<Record<string, unknown>>; methodCards: unknown[] };

const briefingsDir = path.join(process.cwd(), "content", "investment-briefings");
const testFile = path.join(briefingsDir, "2099-01-03-investment-daily-briefing.md");

describe("build-investment-data script", () => {
  beforeAll(async () => {
    ({ buildBriefingsPayload, buildCoveragePayload } = await import("../../scripts/build-investment-data.js"));
  });

  beforeEach(() => {
    fs.mkdirSync(briefingsDir, { recursive: true });
    fs.writeFileSync(
      testFile,
      `---
title: "投资每日简报 · 2099-01-03"
date: "2099-01-03"
brief: "测试摘要"
published: true
tags:
  - 投资每日简报
  - 腾讯控股
  - 港股科技
---

## 近 24 小时确认动态

测试正文。

## 未来重点观察

测试前瞻。

## 来源

- https://example.com/2099-01-03

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
    );
  });

  afterEach(() => {
    fs.rmSync(testFile, { force: true });
  });

  it("生成公开 coverage 投影时只保留 allowlist 字段", () => {
    const payload = buildCoveragePayload();

    expect(payload.areas[0]).not.toHaveProperty("aliases");
    expect(payload.companies[0]).not.toHaveProperty("officialSources");
    expect(payload.methodCards.length).toBeGreaterThan(0);
  });

  it("生成投资简报索引", () => {
    const payload = buildBriefingsPayload();
    const target = payload.items.find((item: { slug: string }) => item.slug === "2099-01-03");

    expect(target).toEqual(
      expect.objectContaining({
        slug: "2099-01-03",
        title: "投资简报 · 2099-01-03",
        brief: "测试摘要",
        url: "/investment/daily-briefings/2099-01-03",
      }),
    );
  });
});
