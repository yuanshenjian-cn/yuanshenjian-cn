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

  it("documents the collection window, V2 content, evidence, and single-review rules", () => {
    const skill = fs.readFileSync("skills/ai-briefing/SKILL.md", "utf8");
    const readme = fs.readFileSync("skills/ai-briefing/README.md", "utf8");
    const sourceMap = fs.readFileSync("skills/ai-briefing/references/source-map.md", "utf8");

    expect(skill).toContain("日期差 × 24 小时");
    expect(skill).toContain("contentRulesV2EffectiveDate");
    expect(skill).toContain("## 补充更新");
    expect(skill).toContain("selection.json");
    expect(skill).toContain("只运行一轮");
    expect(skill).toContain("所有模式的确定性初始化");
    expect(skill).toContain("node scripts/ai-briefing-window.js");
    expect(skill).toContain("node scripts/collect-ai-briefing-feeds.js");
    expect(skill).toContain("查询和成稿模式只允许在该 `.local` runDir 写证据");
    expect(skill).not.toContain("当前执行时刻向前回溯 24 小时");
    expect(skill).not.toContain("最多执行 3 轮审核");
    expect(readme).toContain("450~800");
    expect(readme).toContain("1500~2200");
    expect(readme).toContain("所有模式都先采集");
    const openCodeCommand = fs.readFileSync(".opencode/commands/publish-ai-briefing.md", "utf8");
    expect(openCodeCommand).toContain("不得调用 `scripts/ai-briefing.sh`");
    expect(sourceMap).toContain("source-registry.json");
    expect(sourceMap).toContain("registry 才是程序真源");
    expect(sourceMap).toContain("Anthropic 和 Mistral 常见猜测 RSS 地址曾返回 404");

    const evals = JSON.parse(fs.readFileSync("skills/ai-briefing/evals/evals.json", "utf8"));
    expect(evals.evals).toHaveLength(8);
    expect(evals.evals.every((item: { expected_behavior?: string }) => item.expected_behavior)).toBe(true);
  });

  it("keeps both reviewers read-only with independent web verification", () => {
    const claudeReviewer = fs.readFileSync(".claude/agents/ai-briefing-reviewer.md", "utf8");
    const openCodeReviewer = fs.readFileSync(".opencode/agents/ai-briefing-reviewer.md", "utf8");

    expect(claudeReviewer).toContain("tools: Read, Grep, Glob, WebFetch, WebSearch");
    expect(openCodeReviewer).toContain("edit: deny");
    expect(openCodeReviewer).toContain("bash: deny");
    expect(openCodeReviewer).toContain("task: deny");
    expect(openCodeReviewer).toContain("webfetch: allow");
    expect(openCodeReviewer).toContain("websearch: allow");
    for (const evidenceFile of ["window.json", "collection.json", "discovery.json", "selection.json", "self-review.json"]) {
      expect(claudeReviewer).toContain(evidenceFile);
      expect(openCodeReviewer).toContain(evidenceFile);
    }
  });
});
