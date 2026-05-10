import fs from "node:fs";
import { describe, expect, it } from "vitest";

const mirroredFiles = [
  ["skills/ai-daily-briefing/SKILL.md", ".opencode/skills/ai-daily-briefing/SKILL.md"],
  ["skills/ai-daily-briefing/README.md", ".opencode/skills/ai-daily-briefing/README.md"],
  ["skills/ai-daily-briefing/references/source-map.md", ".opencode/skills/ai-daily-briefing/references/source-map.md"],
  ["skills/ai-daily-briefing/evals/evals.json", ".opencode/skills/ai-daily-briefing/evals/evals.json"],
] as const;

describe("ai skill mirror sync", () => {
  it("keeps mirrored skill files byte-equal", () => {
    for (const [source, mirror] of mirroredFiles) {
      expect(fs.readFileSync(source, "utf8")).toBe(fs.readFileSync(mirror, "utf8"));
    }
  });
});
