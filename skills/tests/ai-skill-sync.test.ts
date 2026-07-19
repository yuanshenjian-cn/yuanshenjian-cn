import fs from "node:fs";
import { describe, expect, it } from "vitest";

const mirroredFiles = [
  [
    "skills/ai-briefing/SKILL.md",
    ".opencode/skills/ai-briefing/SKILL.md",
    ".claude/skills/ai-briefing/SKILL.md",
  ],
  [
    "skills/ai-briefing/README.md",
    ".opencode/skills/ai-briefing/README.md",
    ".claude/skills/ai-briefing/README.md",
  ],
  [
    "skills/ai-briefing/references/source-map.md",
    ".opencode/skills/ai-briefing/references/source-map.md",
    ".claude/skills/ai-briefing/references/source-map.md",
  ],
  [
    "skills/ai-briefing/evals/evals.json",
    ".opencode/skills/ai-briefing/evals/evals.json",
    ".claude/skills/ai-briefing/evals/evals.json",
  ],
  [
    "skills/ai-briefing/config/briefing.json",
    ".opencode/skills/ai-briefing/config/briefing.json",
    ".claude/skills/ai-briefing/config/briefing.json",
  ],
  [
    "skills/ai-briefing/config/focus-companies.json",
    ".opencode/skills/ai-briefing/config/focus-companies.json",
    ".claude/skills/ai-briefing/config/focus-companies.json",
  ],
  [
    "skills/ai-briefing/config/source-registry.json",
    ".opencode/skills/ai-briefing/config/source-registry.json",
    ".claude/skills/ai-briefing/config/source-registry.json",
  ],
  [
    "skills/ai-briefing/config/generator-result.schema.json",
    ".opencode/skills/ai-briefing/config/generator-result.schema.json",
    ".claude/skills/ai-briefing/config/generator-result.schema.json",
  ],
  [
    "skills/ai-briefing/config/reviewer-result.schema.json",
    ".opencode/skills/ai-briefing/config/reviewer-result.schema.json",
    ".claude/skills/ai-briefing/config/reviewer-result.schema.json",
  ],
] as const;

describe("ai skill mirror sync", () => {
  it("keeps mirrored skill files byte-equal", () => {
    for (const [source, ...mirrors] of mirroredFiles) {
      const sourceContent = fs.readFileSync(source, "utf8");
      for (const mirror of mirrors) {
        expect(sourceContent).toBe(fs.readFileSync(mirror, "utf8"));
      }
    }
  });

  it("documents the date coverage, flexible content, evidence, and finalizer rules", () => {
    const skill = fs.readFileSync("skills/ai-briefing/SKILL.md", "utf8");
    const readme = fs.readFileSync("skills/ai-briefing/README.md", "utf8");
    const sourceMap = fs.readFileSync("skills/ai-briefing/references/source-map.md", "utf8");

    expect(skill).toContain("calendar-date-overlap");
    expect(skill).toContain("coverageStartDate");
    expect(skill).toContain("checked-empty");
    expect(skill).toContain("coverageConclusion");
    expect(skill).toContain("candidate.md");
    expect(skill).toContain("finalize-ai-briefing-run.sh");
    expect(skill).toContain("recommendedMin");
    expect(skill).toContain("hardMax");
    expect(skill).toContain("contentRulesV2EffectiveDate");
    expect(skill).toContain("## 补充更新");
    expect(skill).toContain("selection.json");
    expect(skill).toContain("只运行一轮");
    expect(skill).toContain("所有模式的确定性初始化");
    expect(skill).toContain("node scripts/ai-briefing-window.js");
    expect(skill).toContain("node scripts/collect-ai-briefing-feeds.js");
    expect(skill).toContain("查询和成稿模式只允许在该 `.local` runDir 写证据");
    expect(skill).toContain("定向单厂商查询");
    expect(skill).toContain("verify-no-events");
    expect(skill).not.toContain("(windowStart, windowEnd]");
    expect(skill).not.toContain("日期差 × 24 小时");
    expect(skill).not.toContain("date-end-convention");
    expect(skill).not.toContain("不得丢弃合格事件");
    expect(skill).not.toContain("当前执行时刻向前回溯 24 小时");
    expect(skill).not.toContain("最多执行 3 轮审核");
    expect(readme).toContain("450~800");
    expect(readme).toContain("1500~2200");
    expect(readme).toContain("所有模式都先采集");
    expect(readme).toContain("calendar-date-overlap");
    expect(readme).toContain("candidate.md");
    expect(readme).toContain("finalize-ai-briefing-run.sh");
    expect(readme).toContain("hardMax");
    const openCodeCommand = fs.readFileSync(".opencode/commands/publish-ai-briefing.md", "utf8");
    expect(openCodeCommand).not.toContain("ai-briefing.sh");
    expect(openCodeCommand).not.toContain("scripts/finalize-ai-briefing-run.sh");
    expect(openCodeCommand).not.toContain("git commit");
    expect(openCodeCommand).not.toContain("git push");
    expect(sourceMap).toContain("source-registry.json");
    expect(sourceMap).toContain("registry 才是程序真源");
    expect(sourceMap).toContain("Anthropic 和 Mistral 常见猜测 RSS 地址曾返回 404");

    const evals = JSON.parse(fs.readFileSync("skills/ai-briefing/evals/evals.json", "utf8"));
    expect(evals.evals.length).toBeGreaterThanOrEqual(12);
    expect(evals.evals.every((item: { expected_behavior?: string }) => item.expected_behavior)).toBe(true);
    const evalText = JSON.stringify(evals);
    for (const scenario of [
      "日期重叠",
      "checked-empty",
      "no_events",
      "单厂商",
      "degraded",
      "新 revision",
      "hardMax",
    ]) {
      expect(evalText).toContain(scenario);
    }
  });

  it("keeps both reviewers read-only with independent web verification", () => {
    const claudeReviewer = fs.readFileSync(".claude/agents/ai-briefing-reviewer.md", "utf8");
    const openCodeReviewer = fs.readFileSync(".opencode/agents/ai-briefing-reviewer.md", "utf8");
    const policyPath = "skills/ai-briefing/references/reviewer-policy.md";
    const policy = fs.readFileSync(policyPath, "utf8");

    expect(claudeReviewer).toContain("tools: Read, Grep, Glob, WebFetch, WebSearch");
    expect(openCodeReviewer).toContain("edit: deny");
    expect(openCodeReviewer).toContain("bash: deny");
    expect(openCodeReviewer).toContain("task: deny");
    expect(openCodeReviewer).toContain("webfetch: allow");
    expect(openCodeReviewer).toContain("websearch: allow");
    for (const reviewer of [claudeReviewer, openCodeReviewer]) {
      expect(reviewer).toContain(policyPath);
      expect(reviewer).toContain("reviewer-result.schema.json");
      for (const evidenceFile of ["window.json", "collection.json", "discovery.json", "selection.json", "self-review.json"]) {
        expect(reviewer).toContain(evidenceFile);
      }
    }
    for (const requiredRule of [
      "coverageStartDate",
      "coverageEndDate",
      "observedAt",
      "coverageConclusion",
      "allowedUrlPrefixes",
      "recommendedMin",
      "hardMax",
      "重点动态",
      "补充更新",
      "networkStatus",
      "checkedEvidenceIds",
      "uncheckedHighRiskItems",
      "只运行一轮",
    ]) {
      expect(policy).toContain(requiredRule);
    }
    expect(policy).not.toContain("(windowStart, windowEnd]");
    expect(policy).not.toContain("严格字数");
  });
});
