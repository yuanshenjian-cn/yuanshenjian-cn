import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

let buildBriefingsPayload: () => {
  items: Array<{ slug: string; title: string; brief: string; url: string }>;
  briefings: Array<{ slug: string; title: string; brief: string; url: string }>;
};
let buildCoveragePayload: () => { areas: Array<Record<string, unknown>>; companies: Array<Record<string, unknown>>; methodCards: unknown[] };

const briefingsDir = path.resolve(__dirname, "../../content", "investment-briefings");
const nestedBriefingsDir = path.join(briefingsDir, "2199", "01");
const testSlug = "2199-01-01";
const testFile = path.join(nestedBriefingsDir, `${testSlug}-investment-briefing.md`);

describe("build-investment-data script", () => {
  beforeAll(async () => {
    ({ buildBriefingsPayload, buildCoveragePayload } = await import("../build-investment-data.js"));
  });

  beforeEach(() => {
    fs.mkdirSync(nestedBriefingsDir, { recursive: true });
    fs.writeFileSync(
      testFile,
      `---
title: "投资简报 · ${testSlug}"
date: "${testSlug}"
brief: "测试摘要"
published: true
tags:
  - 投资
  - 腾讯控股
  - 港股科技
---

## 近 24 小时确认动态

测试正文。

## 未来重点观察

测试前瞻。

## 来源

- https://example.com/${testSlug}

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
    );
  });

  afterEach(() => {
    fs.rmSync(testFile, { force: true });
    fs.rmSync(path.join(briefingsDir, "2199"), { recursive: true, force: true });
  });

  it("生成公开 coverage 投影时只保留 allowlist 字段", () => {
    const payload = buildCoveragePayload();

    expect(payload.areas[0]).not.toHaveProperty("aliases");
    expect(payload.companies[0]).not.toHaveProperty("officialSources");
    expect(payload.methodCards.length).toBeGreaterThan(0);
  });

  it("生成投资简报索引", () => {
    const payload = buildBriefingsPayload();
    const target = payload.items.find((item: { slug: string }) => item.slug === testSlug);

    expect(payload.briefings).toEqual(payload.items);
    expect(target).toEqual(
      expect.objectContaining({
        slug: testSlug,
        title: `投资简报 · ${testSlug}`,
        brief: "测试摘要",
        url: `/investment/briefings/${testSlug}`,
      }),
    );
  });
});
