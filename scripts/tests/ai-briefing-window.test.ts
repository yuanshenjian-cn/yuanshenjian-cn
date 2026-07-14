import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

interface BriefingWindow {
  previousIssueDate: string | null;
  calendarDayDifference: number | null;
  windowHours: number;
  windowStart: string;
  windowEnd: string;
  strategy: string;
}

let tempRoot: string;
let calculateBriefingWindow: (input: {
  issueDate: string;
  windowEnd: string;
  briefingsRoot: string;
  initialLookbackHours?: number;
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
    ["2026-07-14", 1, 24],
    ["2026-07-13", 2, 48],
    ["2026-07-12", 3, 72],
  ])("uses the calendar-day gap from %s", (previousDate, dayDifference, windowHours) => {
    writeBriefing(previousDate);

    const result = calculateBriefingWindow({
      issueDate: "2026-07-15",
      windowEnd: "2026-07-15T00:00:00.000Z",
      briefingsRoot: tempRoot,
      initialLookbackHours: 24,
    });

    expect(result.previousIssueDate).toBe(previousDate);
    expect(result.calendarDayDifference).toBe(dayDifference);
    expect(result.windowHours).toBe(windowHours);
  });

  it("uses the initial lookback without published history", () => {
    writeBriefing("2026-07-14", false);
    writeBriefing("2026-07-13", true, ".mdx");

    const result = calculateBriefingWindow({
      issueDate: "2026-07-15",
      windowEnd: "2026-07-15T00:00:00.000Z",
      briefingsRoot: tempRoot,
      initialLookbackHours: 24,
    });

    expect(result).toMatchObject({
      previousIssueDate: null,
      calendarDayDifference: null,
      windowHours: 24,
      strategy: "initial-lookback",
    });
  });

  it.each(["2026-07-15", "2026-07-16"])("rejects a published briefing on %s", (date) => {
    writeBriefing(date);

    expect(() =>
      calculateBriefingWindow({
        issueDate: "2026-07-15",
        windowEnd: "2026-07-15T00:00:00.000Z",
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
        "--window-end",
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
      strategy: "calendar-day-gap-hours",
      windowHours: 48,
      windowStart: "2026-07-13T00:00:00.000Z",
      windowEnd: "2026-07-15T00:00:00.000Z",
    });
  });
});
