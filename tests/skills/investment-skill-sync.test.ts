import fs from "node:fs";
import { describe, expect, it } from "vitest";

const mirroredFiles = [
  ["skills/investment-daily-briefing/SKILL.md", ".opencode/skills/investment-daily-briefing/SKILL.md"],
  ["skills/investment-daily-briefing/README.md", ".opencode/skills/investment-daily-briefing/README.md"],
  [
    "skills/investment-daily-briefing/references/source-map.md",
    ".opencode/skills/investment-daily-briefing/references/source-map.md",
  ],
  [
    "skills/investment-daily-briefing/references/event-map.md",
    ".opencode/skills/investment-daily-briefing/references/event-map.md",
  ],
  ["skills/investment-daily-briefing/evals/evals.json", ".opencode/skills/investment-daily-briefing/evals/evals.json"],
  [
    "skills/investment-daily-briefing/config/focus-areas.json",
    ".opencode/skills/investment-daily-briefing/config/focus-areas.json",
  ],
  [
    "skills/investment-daily-briefing/config/focus-companies.json",
    ".opencode/skills/investment-daily-briefing/config/focus-companies.json",
  ],
  [
    "skills/investment-daily-briefing/config/briefing.json",
    ".opencode/skills/investment-daily-briefing/config/briefing.json",
  ],
  [
    "skills/investment-daily-briefing/config/market-watch.json",
    ".opencode/skills/investment-daily-briefing/config/market-watch.json",
  ],
  [
    "skills/investment-daily-briefing/config/toggles.json",
    ".opencode/skills/investment-daily-briefing/config/toggles.json",
  ],
  [
    "skills/investment-daily-briefing/config/blocked-companies.json",
    ".opencode/skills/investment-daily-briefing/config/blocked-companies.json",
  ],
] as const;

describe("investment skill mirror sync", () => {
  it("keeps mirrored skill files byte-equal", () => {
    for (const [source, mirror] of mirroredFiles) {
      expect(fs.readFileSync(source, "utf8")).toBe(fs.readFileSync(mirror, "utf8"));
    }
  });
});
