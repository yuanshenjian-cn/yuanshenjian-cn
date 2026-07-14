#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { siteRequire } = require("./site-require");
const { loadAiBriefingSkillConfig } = require("./briefing-skill-config");

const matter = siteRequire("gray-matter");
const DAY_MS = 24 * 60 * 60 * 1000;

function parseCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`日期必须为 YYYY-MM-DD：${value}`);
  }

  const [year, month, day] = value.split("-").map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`日期不是合法日历日期：${value}`);
  }

  return { year, month, day, timestamp };
}

function differenceInCalendarDays(laterDate, earlierDate) {
  return (parseCalendarDate(laterDate).timestamp - parseCalendarDate(earlierDate).timestamp) / DAY_MS;
}

function getShanghaiDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function listMarkdownFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];

  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(file);
    }
  }

  walk(root);
  return files;
}

function findPreviousPublishedBriefing({ issueDate, briefingsRoot }) {
  parseCalendarDate(issueDate);
  const published = [];

  for (const file of listMarkdownFiles(briefingsRoot)) {
    const parsed = matter(fs.readFileSync(file, "utf8"));
    if (parsed.data.published !== true) continue;
    const date = parsed.data.date;
    parseCalendarDate(date);
    published.push({ date, file });
  }

  const invalidTimelineEntry = published.find((entry) => differenceInCalendarDays(entry.date, issueDate) >= 0);
  if (invalidTimelineEntry) {
    throw new Error(
      `已存在同日或未来日期的已发布 AI 简报：${invalidTimelineEntry.date} (${invalidTimelineEntry.file})`,
    );
  }

  return published.sort((left, right) => right.date.localeCompare(left.date))[0] || null;
}

function calculateBriefingWindow({
  issueDate,
  windowEnd,
  briefingsRoot,
  initialLookbackHours = 24,
}) {
  parseCalendarDate(issueDate);
  const windowEndDate = new Date(windowEnd);
  if (Number.isNaN(windowEndDate.getTime())) throw new Error(`windowEnd 不是合法时间：${windowEnd}`);
  if (!Number.isFinite(initialLookbackHours) || initialLookbackHours <= 0) {
    throw new Error("initialLookbackHours 必须为正数");
  }

  const previous = findPreviousPublishedBriefing({ issueDate, briefingsRoot });
  const calendarDayDifference = previous ? differenceInCalendarDays(issueDate, previous.date) : null;
  const windowHours = previous ? calendarDayDifference * 24 : initialLookbackHours;
  const windowStart = new Date(windowEndDate.getTime() - windowHours * 60 * 60 * 1000).toISOString();

  return {
    issueDate,
    previousIssueDate: previous?.date || null,
    calendarDayDifference,
    windowHours,
    windowStart,
    windowEnd: windowEndDate.toISOString(),
    timezone: "Asia/Shanghai",
    strategy: previous ? "calendar-day-gap-hours" : "initial-lookback",
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) throw new Error(`未知参数：${argument}`);
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`参数缺少值：${argument}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.output) throw new Error("缺少 --output");
  const now = new Date();
  const config = loadAiBriefingSkillConfig().briefing;
  const result = calculateBriefingWindow({
    issueDate: args["issue-date"] || getShanghaiDate(now),
    windowEnd: args["window-end"] || now.toISOString(),
    briefingsRoot: args["briefings-root"] || path.resolve(__dirname, "..", "content", "ai-briefings"),
    initialLookbackHours: args["initial-lookback-hours"]
      ? Number(args["initial-lookback-hours"])
      : config.initialLookbackHours,
  });

  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(
    `AI 简报窗口：${result.issueDate}，回溯 ${result.windowHours} 小时，${result.windowStart} -> ${result.windowEnd}\n`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  calculateBriefingWindow,
  differenceInCalendarDays,
  findPreviousPublishedBriefing,
  getShanghaiDate,
  parseCalendarDate,
};
