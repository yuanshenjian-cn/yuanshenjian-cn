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
});
