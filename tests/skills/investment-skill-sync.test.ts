import fs from "node:fs";
import { describe, expect, it } from "vitest";

const mirroredFiles = [
  [
    "skills/investment-briefing/SKILL.md",
    ".opencode/skills/investment-briefing/SKILL.md",
    ".claude/skills/investment-briefing/SKILL.md",
  ],
  [
    "skills/investment-briefing/README.md",
    ".opencode/skills/investment-briefing/README.md",
    ".claude/skills/investment-briefing/README.md",
  ],
  [
    "skills/investment-briefing/references/source-map.md",
    ".opencode/skills/investment-briefing/references/source-map.md",
    ".claude/skills/investment-briefing/references/source-map.md",
  ],
  [
    "skills/investment-briefing/references/event-map.md",
    ".opencode/skills/investment-briefing/references/event-map.md",
    ".claude/skills/investment-briefing/references/event-map.md",
  ],
  [
    "skills/investment-briefing/evals/evals.json",
    ".opencode/skills/investment-briefing/evals/evals.json",
    ".claude/skills/investment-briefing/evals/evals.json",
  ],
  [
    "skills/investment-briefing/config/focus-areas.json",
    ".opencode/skills/investment-briefing/config/focus-areas.json",
    ".claude/skills/investment-briefing/config/focus-areas.json",
  ],
  [
    "skills/investment-briefing/config/focus-companies.json",
    ".opencode/skills/investment-briefing/config/focus-companies.json",
    ".claude/skills/investment-briefing/config/focus-companies.json",
  ],
  [
    "skills/investment-briefing/config/briefing.json",
    ".opencode/skills/investment-briefing/config/briefing.json",
    ".claude/skills/investment-briefing/config/briefing.json",
  ],
  [
    "skills/investment-briefing/config/market-watch.json",
    ".opencode/skills/investment-briefing/config/market-watch.json",
    ".claude/skills/investment-briefing/config/market-watch.json",
  ],
  [
    "skills/investment-briefing/config/toggles.json",
    ".opencode/skills/investment-briefing/config/toggles.json",
    ".claude/skills/investment-briefing/config/toggles.json",
  ],
  [
    "skills/investment-briefing/config/blocked-companies.json",
    ".opencode/skills/investment-briefing/config/blocked-companies.json",
    ".claude/skills/investment-briefing/config/blocked-companies.json",
  ],
] as const;

describe("investment skill mirror sync", () => {
  it("keeps mirrored skill files byte-equal", () => {
    for (const [source, ...mirrors] of mirroredFiles) {
      const sourceContent = fs.readFileSync(source, "utf8");
      for (const mirror of mirrors) {
        expect(sourceContent).toBe(fs.readFileSync(mirror, "utf8"));
      }
    }
  });
});
