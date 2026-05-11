import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const briefingsDir = path.join(process.cwd(), "content", "investment-briefings");
const testFile = path.join(briefingsDir, "2099-01-04-investment-daily-briefing.md");
const relativeTestFile = "content/investment-briefings/2099-01-04-investment-daily-briefing.md";

describe("validate-post investment briefing guards", () => {
  beforeEach(() => {
    fs.mkdirSync(briefingsDir, { recursive: true });
    fs.writeFileSync(
      testFile,
      `---
title: "投资每日简报 · 2099-01-04"
date: "2099-01-04"
brief: "测试元说明门禁"
published: true
tags:
  - 投资每日简报
  - 腾讯控股
  - 港股科技
---

## 近 24 小时确认动态

- 市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。
- 本期重点是把已经官宣的财报节点重新排序，而不是追逐零碎周末新闻。
- 市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。
- 市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

## 未来重点观察

- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/2099-01-04

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
    );
  });

  afterEach(() => {
    fs.rmSync(testFile, { force: true });
  });

  it("rejects leaked editorial reasoning in published investment briefings", () => {
    try {
      execFileSync("node", ["scripts/validate-post.js", relativeTestFile], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: "pipe",
      });
      throw new Error("validate-post should have failed");
    } catch (error) {
      const output = error instanceof Error && "stderr" in error ? String(error.stderr) : String(error);
      expect(output).toContain("投资每日简报包含生成前思考/取舍说明，不得进入公开正文");
      expect(output).toContain("本期重点是把已经官宣的财报节点重新排序");
    }
  });

  it("rejects mismatched weekday labels in investment briefings", () => {
    fs.writeFileSync(
      testFile,
      `---
title: "投资每日简报 · 2099-01-04"
date: "2099-01-04"
brief: "测试日期与星期门禁"
published: true
tags:
  - 投资每日简报
  - 腾讯控股
  - 港股科技
---

## 近 24 小时确认动态

- 市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。
- 2099-01-04（周一）某事件确认落地。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。
- 1 月 6 日（周三）某财报节点临近。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。
- 市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

## 未来重点观察

- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。
- 未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/2099-01-04

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
    );

    try {
      execFileSync("node", ["scripts/validate-post.js", relativeTestFile], {
        cwd: process.cwd(),
        encoding: "utf8",
        stdio: "pipe",
      });
      throw new Error("validate-post should have failed");
    } catch (error) {
      const output = error instanceof Error && "stderr" in error ? String(error.stderr) : String(error);
      expect(output).toContain("投资每日简报日期与星期不一致：2099-01-04（周一）（应为 周日）");
      expect(output).toContain("投资每日简报日期与星期不一致：1 月 6 日（周三）（应为 周二）");
    }
  });
});
