import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

interface BriefingWindow {
  previousIssueDate: string | null;
  nominalDays: number;
  coverageStartDate: string;
  coverageEndDate: string;
  observedAt: string;
  searchStartDate: string;
  searchEndDateExclusive: string;
  strategy: "calendar-date-overlap" | "initial-calendar-date-lookback";
}

let tempRoot: string;
let calculateBriefingWindow: (input: {
  issueDate: string;
  observedAt: string;
  briefingsRoot: string;
  initialLookbackDays?: number;
}) => BriefingWindow;

function writeBriefing(date: string, published = true, extension = ".md") {
  const file = path.join(tempRoot, date.slice(0, 4), date.slice(5, 7), `${date}-ai-briefing${extension}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `---\ndate: "${date}"\npublished: ${published}\n---\n`);
}

beforeEach(async () => {
  tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ai-briefing-window-"));
  ({ calculateBriefingWindow } = await import("../ai-briefing-window.js"));
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("AI briefing calendar-day window", () => {
  it.each([
    ["2026-07-14", 1],
    ["2026-07-13", 2],
    ["2026-07-12", 3],
  ])("uses an inclusive calendar-date overlap from %s", (previousDate, nominalDays) => {
    writeBriefing(previousDate);

    const result = calculateBriefingWindow({
      issueDate: "2026-07-15",
      observedAt: "2026-07-15T12:00:00.000Z",
      briefingsRoot: tempRoot,
      initialLookbackDays: 1,
    });

    expect(result.previousIssueDate).toBe(previousDate);
    expect(result.nominalDays).toBe(nominalDays);
    expect(result.coverageStartDate).toBe(previousDate);
    expect(result.coverageEndDate).toBe("2026-07-15");
    expect(result.observedAt).toBe("2026-07-15T12:00:00.000Z");
    expect(result).not.toHaveProperty("windowStart");
  });

  it("uses the initial lookback without published history", () => {
    writeBriefing("2026-07-14", false);
    writeBriefing("2026-07-13", true, ".mdx");

    const result = calculateBriefingWindow({
      issueDate: "2026-07-15",
      observedAt: "2026-07-15T00:00:00.000Z",
      briefingsRoot: tempRoot,
      initialLookbackDays: 1,
    });

    expect(result).toMatchObject({
      previousIssueDate: null,
      nominalDays: 1,
      coverageStartDate: "2026-07-14",
      coverageEndDate: "2026-07-15",
      searchStartDate: "2026-07-13",
      searchEndDateExclusive: "2026-07-17",
      strategy: "initial-calendar-date-lookback",
    });
  });

  it.each(["2026-07-15", "2026-07-16"])("rejects a published briefing on %s", (date) => {
    writeBriefing(date);

    expect(() =>
      calculateBriefingWindow({
        issueDate: "2026-07-15",
        observedAt: "2026-07-15T00:00:00.000Z",
        briefingsRoot: tempRoot,
      }),
    ).toThrow("已存在同日或未来日期的已发布 AI 简报");
  });

  it("writes stable JSON from the CLI", () => {
    writeBriefing("2026-07-13");
    const output = path.join(tempRoot, "run", "window.json");
    const result = spawnSync(
      "node",
      [
        "scripts/ai-briefing-window.js",
        "--issue-date",
        "2026-07-15",
        "--observed-at",
        "2026-07-15T00:00:00.000Z",
        "--briefings-root",
        tempRoot,
        "--output",
        output,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(0);
    expect(JSON.parse(fs.readFileSync(output, "utf8"))).toMatchObject({
      strategy: "calendar-date-overlap",
      nominalDays: 2,
      coverageStartDate: "2026-07-13",
      coverageEndDate: "2026-07-15",
      observedAt: "2026-07-15T00:00:00.000Z",
      searchStartDate: "2026-07-12",
      searchEndDateExclusive: "2026-07-17",
    });
  });
});
