import fs from "node:fs";
import { describe, expect, it } from "vitest";

const mirroredFiles = [
  [
    "skills/llm-family-guard/SKILL.md",
    ".opencode/skills/llm-family-guard/SKILL.md",
    ".claude/skills/llm-family-guard/SKILL.md",
  ],
  [
    "skills/llm-family-guard/README.md",
    ".opencode/skills/llm-family-guard/README.md",
    ".claude/skills/llm-family-guard/README.md",
  ],
  [
    "skills/llm-family-guard/references/source-map.md",
    ".opencode/skills/llm-family-guard/references/source-map.md",
    ".claude/skills/llm-family-guard/references/source-map.md",
  ],
  [
    "skills/llm-family-guard/evals/evals.json",
    ".opencode/skills/llm-family-guard/evals/evals.json",
    ".claude/skills/llm-family-guard/evals/evals.json",
  ],
  [
    "skills/llm-family-guard/config/focus-companies.json",
    ".opencode/skills/llm-family-guard/config/focus-companies.json",
    ".claude/skills/llm-family-guard/config/focus-companies.json",
  ],
] as const;

describe("llm family guard skill mirror sync", () => {
  it("keeps mirrored skill files byte-equal", () => {
    for (const [source, ...mirrors] of mirroredFiles) {
      const sourceContent = fs.readFileSync(source, "utf8");
      for (const mirror of mirrors) {
        expect(sourceContent).toBe(fs.readFileSync(mirror, "utf8"));
      }
    }
  });
});
