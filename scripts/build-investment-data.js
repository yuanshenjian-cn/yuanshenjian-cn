#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT } = require("./briefing-skill-config.js");

const ROOT = path.resolve(__dirname, "..");
const CONFIG_DIRECTORY = INVESTMENT_BRIEFING_SKILL_CONFIG_ROOT;
const BRIEFINGS_DIRECTORY = path.join(ROOT, "content", "investment-briefings");
const OUTPUT_DIRECTORY = path.join(ROOT, "public", "investment-data");
const OUTPUT_BRIEFINGS_DIRECTORY = path.join(OUTPUT_DIRECTORY, "briefings");
const OUTPUT_COVERAGE_FILE = path.join(OUTPUT_DIRECTORY, "coverage.json");
const OUTPUT_BRIEFINGS_FILE = path.join(OUTPUT_BRIEFINGS_DIRECTORY, "index.json");
const REDLINE_RE = /(值得买入|建议加仓|目标价|推荐买入|推荐关注|仓位|上车|抄底|止盈|止损|强推|配置价值)/;
const PRIORITIES = new Set(["core", "important", "event-driven"]);
const AREA_TYPES = new Set(["index", "theme", "sector", "industry", "style"]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function getAllMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function parseTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0);
}

function buildExcerpt(brief, content) {
  if (typeof brief === "string" && brief.trim().length > 0) {
    return brief.trim();
  }

  const cleaned = content.replace(/```[\s\S]*?```/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.length > 180 ? `${cleaned.slice(0, 180)}...` : cleaned;
}

function assertNoRedline(text, fieldPath) {
  if (typeof text === "string" && REDLINE_RE.test(text)) {
    throw new Error(`${fieldPath} 包含投资红线表达：${text}`);
  }
}

function assertString(value, fieldPath) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldPath} 必须是非空字符串`);
  }
}

function assertBoolean(value, fieldPath) {
  if (typeof value !== "boolean") {
    throw new Error(`${fieldPath} 必须是布尔值`);
  }
}

function assertStringArray(value, fieldPath) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim().length === 0)) {
    throw new Error(`${fieldPath} 必须是非空字符串数组`);
  }
}

function validateConfigShape() {
  const briefing = readJson(path.join(CONFIG_DIRECTORY, "briefing.json"));
  const areas = readJson(path.join(CONFIG_DIRECTORY, "focus-areas.json"));
  const companies = readJson(path.join(CONFIG_DIRECTORY, "focus-companies.json"));

  assertString(briefing.timezone, "briefing.timezone");
  assertString(briefing.coveragePageTitle, "briefing.coveragePageTitle");
  assertString(briefing.coveragePageIntro, "briefing.coveragePageIntro");
  assertString(briefing.disclaimer, "briefing.disclaimer");
  assertNoRedline(briefing.coveragePageIntro, "briefing.coveragePageIntro");
  assertNoRedline(briefing.disclaimer, "briefing.disclaimer");

  if (!Array.isArray(briefing.methodCards) || briefing.methodCards.length === 0) {
    throw new Error("briefing.methodCards 必须是非空数组");
  }
  for (const [index, card] of briefing.methodCards.entries()) {
    assertString(card.title, `briefing.methodCards[${index}].title`);
    assertString(card.description, `briefing.methodCards[${index}].description`);
    assertNoRedline(card.title, `briefing.methodCards[${index}].title`);
    assertNoRedline(card.description, `briefing.methodCards[${index}].description`);
  }

  assertStringArray(briefing.boundaryStatements, "briefing.boundaryStatements");
  for (const [index, statement] of briefing.boundaryStatements.entries()) {
    assertNoRedline(statement, `briefing.boundaryStatements[${index}]`);
  }

  for (const [index, area] of areas.entries()) {
    assertString(area.name, `focus-areas[${index}].name`);
    if (!AREA_TYPES.has(area.type)) {
      throw new Error(`focus-areas[${index}].type 非法：${area.type}`);
    }
    if (!PRIORITIES.has(area.priority)) {
      throw new Error(`focus-areas[${index}].priority 非法：${area.priority}`);
    }
    assertBoolean(area.mustCheck, `focus-areas[${index}].mustCheck`);
    assertBoolean(area.showOnCoveragePage, `focus-areas[${index}].showOnCoveragePage`);
    assertString(area.publicSummary, `focus-areas[${index}].publicSummary`);
    assertStringArray(area.publicTags, `focus-areas[${index}].publicTags`);
    assertNoRedline(area.publicSummary, `focus-areas[${index}].publicSummary`);
    for (const [tagIndex, tag] of area.publicTags.entries()) {
      assertNoRedline(tag, `focus-areas[${index}].publicTags[${tagIndex}]`);
    }
  }

  for (const [index, company] of companies.entries()) {
    assertString(company.name, `focus-companies[${index}].name`);
    assertString(company.ticker, `focus-companies[${index}].ticker`);
    if (!PRIORITIES.has(company.priority)) {
      throw new Error(`focus-companies[${index}].priority 非法：${company.priority}`);
    }
    assertBoolean(company.mustCheck, `focus-companies[${index}].mustCheck`);
    assertBoolean(company.showOnCoveragePage, `focus-companies[${index}].showOnCoveragePage`);
    assertString(company.publicSummary, `focus-companies[${index}].publicSummary`);
    assertStringArray(company.publicFocusPoints, `focus-companies[${index}].publicFocusPoints`);
    assertNoRedline(company.publicSummary, `focus-companies[${index}].publicSummary`);
    for (const [pointIndex, point] of company.publicFocusPoints.entries()) {
      assertNoRedline(point, `focus-companies[${index}].publicFocusPoints[${pointIndex}]`);
    }
  }
}

function buildCoveragePayload() {
  const briefing = readJson(path.join(CONFIG_DIRECTORY, "briefing.json"));
  const areas = readJson(path.join(CONFIG_DIRECTORY, "focus-areas.json"))
    .filter((item) => item.showOnCoveragePage)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ name, type, priority, publicSummary, publicTags, sortOrder }) => {
      assertNoRedline(publicSummary, `focus-areas:${name}.publicSummary`);
      return { name, type, priority, publicSummary, publicTags, sortOrder };
    });
  const companies = readJson(path.join(CONFIG_DIRECTORY, "focus-companies.json"))
    .filter((item) => item.showOnCoveragePage)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ name, ticker, market, priority, publicSummary, publicFocusPoints, sortOrder }) => {
      assertNoRedline(publicSummary, `focus-companies:${name}.publicSummary`);
      for (const point of publicFocusPoints) {
        assertNoRedline(point, `focus-companies:${name}.publicFocusPoints`);
      }
      return { name, ticker, market, priority, publicSummary, publicFocusPoints, sortOrder };
    });

  return {
    title: briefing.coveragePageTitle,
    intro: briefing.coveragePageIntro,
    disclaimer: briefing.disclaimer,
    methodCards: briefing.methodCards,
    boundaryStatements: briefing.boundaryStatements,
    areas,
    companies,
  };
}

function normalizeInvestmentBriefingTitle(title) {
  return title.replace(/^投资简报/, "投资简报");
}

function parseBriefingFile(filePath) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (typeof data.title !== "string" || typeof data.date !== "string" || typeof data.brief !== "string") {
      console.warn(`Skipping invalid investment briefing: ${path.relative(process.cwd(), filePath)}`);
      return null;
    }

    const tags = parseTags(data.tags);
    const excerpt = buildExcerpt(data.brief, content);

    if (data.published !== true || tags.length === 0 || !excerpt) {
      return null;
    }

    const slug = data.date;

    return {
      slug,
      title: normalizeInvestmentBriefingTitle(data.title),
      brief: data.brief,
      tags,
      date: new Date(data.date).toISOString(),
      url: `/investment/briefings/${slug}`,
    };
  } catch (error) {
    console.error(`Error parsing investment briefing file ${path.relative(process.cwd(), filePath)}:`, error);
    return null;
  }
}

function buildBriefingsPayload() {
  const items = getAllMarkdownFiles(BRIEFINGS_DIRECTORY)
    .map(parseBriefingFile)
    .filter((briefing) => briefing !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());

  return {
    generated: items[0]?.date ?? "",
    items,
    briefings: items,
  };
}

function main() {
  validateConfigShape();
  const coverage = buildCoveragePayload();
  const briefings = buildBriefingsPayload();

  fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
  fs.mkdirSync(OUTPUT_BRIEFINGS_DIRECTORY, { recursive: true });

  writeJson(OUTPUT_COVERAGE_FILE, coverage);
  writeJson(OUTPUT_BRIEFINGS_FILE, briefings);

  console.log(`Generated investment coverage payload at ${path.relative(process.cwd(), OUTPUT_COVERAGE_FILE)}`);
  console.log(`Generated ${briefings.items.length} investment briefing index entries at ${path.relative(process.cwd(), OUTPUT_BRIEFINGS_FILE)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  buildBriefingsPayload,
  buildCoveragePayload,
  main,
  parseBriefingFile,
};
