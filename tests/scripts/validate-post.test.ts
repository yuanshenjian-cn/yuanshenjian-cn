import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const investmentBriefingsDir = path.join(process.cwd(), "content", "investment-briefings");
const investmentTestFile = path.join(investmentBriefingsDir, "2099-01-04-investment-briefing.md");
const relativeInvestmentTestFile = "content/investment-briefings/2099-01-04-investment-briefing.md";
const previousInvestmentFiles = [
  path.join(investmentBriefingsDir, "2099-01-03-investment-briefing.md"),
  path.join(investmentBriefingsDir, "2099-01-02-investment-briefing.md"),
  path.join(investmentBriefingsDir, "2099-01-01-investment-briefing.md"),
  path.join(investmentBriefingsDir, "2098-12-31-investment-briefing.md"),
  path.join(investmentBriefingsDir, "2098-12-30-investment-briefing.md"),
];

const aiBriefingsDir = path.join(process.cwd(), "content", "ai-briefings");
const aiTestFile = path.join(aiBriefingsDir, "2099-01-06-ai-briefing.md");
const relativeAiTestFile = "content/ai-briefings/2099-01-06-ai-briefing.md";
const previousAiFiles = [
  path.join(aiBriefingsDir, "2099-01-05-ai-briefing.md"),
  path.join(aiBriefingsDir, "2099-01-04-ai-briefing.md"),
  path.join(aiBriefingsDir, "2099-01-03-ai-briefing.md"),
  path.join(aiBriefingsDir, "2099-01-02-ai-briefing.md"),
  path.join(aiBriefingsDir, "2099-01-01-ai-briefing.md"),
];

function runValidate(relativePath: string): never {
  try {
    execFileSync("node", ["scripts/validate-post.js", relativePath], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: "pipe",
    });
    throw new Error("validate-post should have failed");
  } catch (error) {
    throw error;
  }
}

function getStderr(error: unknown): string {
  return error instanceof Error && "stderr" in error ? String(error.stderr) : String(error);
}

function writeInvestmentBriefing(filePath: string, date: string, body: string, brief = "测试投资简报") {
  fs.writeFileSync(
    filePath,
    `---
title: "投资简报 · ${date}"
date: "${date}"
brief: "${brief}"
published: true
tags:
  - 投资简报
  - 腾讯控股
  - 港股科技
---

${body}`,
  );
}

function writeAiBriefing(filePath: string, date: string, body: string, brief = "测试 AI 简报") {
  fs.writeFileSync(
    filePath,
    `---
title: "AI 简报 · ${date}"
date: "${date}"
brief: "${brief}"
published: true
tags:
  - AI
  - OpenAI
---

${body}`,
  );
}

describe("validate-post investment briefing guards", () => {
  beforeEach(() => {
    fs.mkdirSync(investmentBriefingsDir, { recursive: true });
    writeInvestmentBriefing(
      investmentTestFile,
      "2099-01-04",
      `## 近 24 小时确认动态

### 测试事件 A

市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

本期重点是把已经官宣的财报节点重新排序，而不是追逐零碎周末新闻。

### 测试事件 B

市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

## 未来重点观察

### 未来观察 A

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

### 未来观察 B

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/2099-01-04

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
      "测试元说明门禁",
    );
  });

  afterEach(() => {
    fs.rmSync(investmentTestFile, { force: true });
    for (const file of previousInvestmentFiles) {
      fs.rmSync(file, { force: true });
    }
  });

  it("rejects leaked editorial reasoning in published investment briefings", () => {
    try {
      runValidate(relativeInvestmentTestFile);
    } catch (error) {
      const output = getStderr(error);
      expect(output).toContain("投资简报包含生成前思考/取舍说明，不得进入公开正文");
      expect(output).toContain("本期重点是把已经官宣的财报节点重新排序");
    }
  });

  it("rejects mismatched weekday labels in investment briefings", () => {
    writeInvestmentBriefing(
      investmentTestFile,
      "2099-01-04",
      `## 近 24 小时确认动态

### 日期测试

2099-01-04（周一）某事件确认落地。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

1 月 6 日（周三）某财报节点临近。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

### 补充测试

市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。市场数据测试。

## 未来重点观察

### 未来观察 A

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

### 未来观察 B

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/2099-01-04

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
      "测试日期与星期门禁",
    );

    try {
      runValidate(relativeInvestmentTestFile);
    } catch (error) {
      const output = getStderr(error);
      expect(output).toContain("投资简报日期与星期不一致：2099-01-04（周一）（应为 周日）");
      expect(output).toContain("投资简报日期与星期不一致：1 月 6 日（周三）（应为 周二）");
    }
  });

  it("rejects duplicate confirmed events from recent five investment briefings", () => {
    const dates = ["2099-01-03", "2099-01-02", "2099-01-01", "2098-12-31", "2098-12-30"];
    previousInvestmentFiles.forEach((file, index) => {
      writeInvestmentBriefing(
        file,
        dates[index],
        `## 近 24 小时确认动态

### 英伟达财报看新利润口径

英伟达将于 5 月 20 日召开 FY27 第一季度业绩说明会。公司前期指引一季度收入约 780 亿美元，FY27 起非 GAAP 财务指标不再排除股票薪酬费用，利润率口径对比方式将发生变化。

## 未来重点观察

### 其他观察

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/${dates[index]}

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
      );
    });

    writeInvestmentBriefing(
      investmentTestFile,
      "2099-01-04",
      `## 近 24 小时确认动态

### 英伟达财报看新利润口径

英伟达将于 5 月 20 日召开 FY27 第一季度业绩说明会。公司前期指引一季度收入约 780 亿美元，FY27 起非 GAAP 财务指标不再排除股票薪酬费用，利润率口径对比方式将发生变化。

## 未来重点观察

### 其他观察

未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。未来观察测试。

## 来源

- https://example.com/2099-01-04

**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**`,
      "测试最近 5 期去重",
    );

    try {
      runValidate(relativeInvestmentTestFile);
    } catch (error) {
      const output = getStderr(error);
      expect(output).toContain("投资简报 最近 5 期存在疑似重复事件");
      expect(output).toContain("英伟达财报看新利润口径");
      expect(output).toContain("content/investment-briefings/2099-01-03-investment-briefing.md");
    }
  });
});

describe("validate-post ai briefing guards", () => {
  beforeEach(() => {
    fs.mkdirSync(aiBriefingsDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(aiTestFile, { force: true });
    for (const file of previousAiFiles) {
      fs.rmSync(file, { force: true });
    }
  });

  it("rejects duplicate events from recent five ai briefings", () => {
    const dates = ["2099-01-05", "2099-01-04", "2099-01-03", "2099-01-02", "2099-01-01"];
    previousAiFiles.forEach((file, index) => {
      writeAiBriefing(
        file,
        dates[index],
        `## 速览

- OpenAI 推出 Realtime API 新语音矩阵。

## 重点动态

### OpenAI 推出 Realtime API 新语音矩阵

OpenAI 在 1 月 5 日把 Realtime API 升级为完整的语音模型矩阵，覆盖实时对话、翻译与长时段流式转写，面向呼叫中心、车载语音与跨语言会议场景。

## 为什么值得关注

### 语音入口竞争加剧

这意味着语音交互已经不再只是演示功能，而是直接进入平台级基础能力竞争。

## 来源

- https://example.com/${dates[index]}
`,
      );
    });

    writeAiBriefing(
      aiTestFile,
      "2099-01-06",
      `## 速览

- OpenAI 推出 Realtime API 新语音矩阵。

## 重点动态

### OpenAI 推出 Realtime API 新语音矩阵

OpenAI 在 1 月 6 日把 Realtime API 升级为完整的语音模型矩阵，覆盖实时对话、翻译与长时段流式转写，面向呼叫中心、车载语音与跨语言会议场景。

## 为什么值得关注

### 语音入口竞争加剧

这意味着语音交互已经不再只是演示功能，而是直接进入平台级基础能力竞争。

## 来源

- https://example.com/2099-01-06
`,
      "测试 AI 最近 5 期去重",
    );

    try {
      runValidate(relativeAiTestFile);
    } catch (error) {
      const output = getStderr(error);
      expect(output).toContain("AI 简报 最近 5 期存在疑似重复事件");
      expect(output).toContain("OpenAI 推出 Realtime API 新语音矩阵");
      expect(output).toContain("content/ai-briefings/2099-01-05-ai-briefing.md");
    }
  });

  it("does not retroactively reject ai briefings before dedupe effective date", () => {
    const previousDate = "2026-04-15";
    const currentDate = "2026-04-18";

    writeAiBriefing(
      previousAiFiles[0],
      previousDate,
      `## 速览

- Northwestern 大学可印刷人工神经元研究成果发表于 Nature Nanotechnology。

## 重点动态

### Northwestern 大学

Northwestern 大学 McCormick 工程学院团队在 4 月 15 日于 Nature Nanotechnology 发表研究成果，开发出可印刷的人工神经元，并与活体脑细胞实现双向通信。

该器件采用气溶胶喷射印刷工艺，以二硫化钼半导体材料和石墨烯导电层构建，重点验证柔性器件在真实神经组织中的信号耦合能力。研究团队在离体小鼠小脑切片上观察到，人工神经元发出的脉冲能够诱发 Purkinje 神经元产生响应。

论文还给出了器件在高频工作条件下的稳定性数据，说明这条路线不只是概念展示，而是在朝可重复、可制造的神经接口元件推进。

## 为什么值得关注

### 生物电子融合继续推进

这说明神经形态硬件正在从概念验证走向更可落地的实验阶段。对于脑机接口、神经假肢和低功耗类脑计算来说，柔性、低成本且可批量制造的器件路线一直是关键瓶颈。

如果这类人工神经元后续能继续改善长期稳定性与生物相容性，那么它不仅会影响医疗设备设计，也可能改变 AI 硬件对“感知-反馈”闭环的理解方式。

## 来源

- https://example.com/${previousDate}
`,
    );

    writeAiBriefing(
      aiTestFile,
      currentDate,
      `## 速览

- Northwestern 大学开发出可印刷人工神经元，首次实现与活体脑细胞直接通信。

## 重点动态

### Northwestern 大学

Northwestern 大学在 4 月 18 日宣布其可印刷人工神经元成果发表于 Nature Nanotechnology，并强调该器件可与活体脑细胞直接双向通信。

团队进一步公开说明，这类人工神经元兼具柔性、低成本和可扩展制造优势，能够在保持高频工作能力的同时减少传统刚性电极长期植入带来的组织损伤风险。研究描述显示，器件在超过 10 的 6 次方个周期内保持稳定，并在动物组织切片实验中验证了有效刺激能力。

这次公开稿还更明确地把该成果与恢复听力、视力和运动能力等潜在医疗场景联系起来，说明研究团队已经在对外叙述中开始强调临床转化价值。

## 为什么值得关注

### 脑机接口材料路线继续扩展

这类器件为柔性脑机接口和神经假肢提供了新的硬件方向。相比单纯追求更强算力的 AI 芯片路线，这类研究把注意力放在“如何更自然地与生物系统耦合”上，代表了另一条重要前沿。

如果后续能证明其长期植入稳定性和安全性，开发者就需要重新评估神经接口、边缘感知和生物电子系统之间的工程边界。

## 来源

- https://example.com/${currentDate}
`,
      "测试去重生效日期不回溯",
    );

    try {
      runValidate(relativeAiTestFile);
    } catch (error) {
      const output = getStderr(error);
      expect(output).not.toContain("AI 简报 最近 5 期存在疑似重复事件");
      expect(output).toContain("AI 简报正文汉字数");
    }
  });
});
