#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  aiBriefingsDir,
  blogContentDir,
  investmentBriefingsDir,
  repoRoot,
  siteDir,
} = require("../config/workspace-paths.js");

const VERSION = 1;
const POSTS_PER_PAGE = 12;
const CACHE_DIR = path.join(siteDir, ".cache", "site-build");
const PLAN_FILE = path.join(CACHE_DIR, "plan.json");
const STATE_FILE = path.join(CACHE_DIR, "state.json");
const DIST_DIR = path.join(siteDir, "dist");

const SOURCE_DIRECTORIES = [
  path.join(siteDir, "app"),
  path.join(siteDir, "components"),
  path.join(siteDir, "hooks"),
  path.join(siteDir, "lib"),
  path.join(siteDir, "types"),
];

const EXCLUDED_SOURCE_FILES = new Set([
  path.join(siteDir, "lib", "site-build-plan.ts"),
]);

const SOURCE_FILES = [
  path.join(siteDir, "package.json"),
  path.join(siteDir, "package-lock.json"),
  path.join(siteDir, "next.config.ts"),
  path.join(siteDir, "tailwind.config.ts"),
  path.join(siteDir, "tsconfig.json"),
  path.join(repoRoot, "config", "workspace-paths.js"),
  path.join(repoRoot, "scripts", "build-ai-data.js"),
  path.join(repoRoot, "scripts", "build-investment-data.js"),
  __filename,
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function repoRelativePath(filePath) {
  return toPosixPath(path.relative(repoRoot, filePath));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
}

function collectFiles(dir, includeRe) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if ([".cache", ".next", "dist", "node_modules"].includes(entry.name)) {
        return [];
      }

      return collectFiles(fullPath, includeRe);
    }

    return entry.isFile() && includeRe.test(entry.name) ? [fullPath] : [];
  }).sort();
}

function hashFile(filePath) {
  return crypto.createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

function hashFiles(files) {
  const hash = crypto.createHash("sha1");
  for (const filePath of files.filter((file) => fs.existsSync(file)).sort()) {
    hash.update(repoRelativePath(filePath));
    hash.update("\0");
    hash.update(fs.readFileSync(filePath));
    hash.update("\0");
  }

  return hash.digest("hex");
}

function extractFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return "";
  }

  const closingIndex = content.indexOf("\n---", 4);
  return closingIndex === -1 ? "" : content.slice(4, closingIndex);
}

function extractFrontmatterDate(content) {
  const match = extractFrontmatter(content).match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})["']?\s*$/m);
  return match?.[1] ?? null;
}

function isPublished(content) {
  const match = extractFrontmatter(content).match(/^published:\s*(.+?)\s*$/m);
  if (!match) {
    return true;
  }

  return match[1].trim().replace(/^['"]|['"]$/g, "").toLowerCase() !== "false";
}

function parseArticleFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const slug = path.basename(filePath).replace(/\.mdx?$/i, "");

  return {
    hash: hashFile(filePath),
    path: repoRelativePath(filePath),
    published: isPublished(content),
    slug,
  };
}

function parseBriefingFile(filePath, suffix) {
  const content = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath);
  const fileDate = fileName.match(new RegExp(`^(\\d{4}-\\d{2}-\\d{2})-${suffix}\\.md$`))?.[1] ?? null;
  const slug = extractFrontmatterDate(content) ?? fileDate;

  if (!slug) {
    return null;
  }

  return {
    hash: hashFile(filePath),
    month: slug.slice(0, 7),
    path: repoRelativePath(filePath),
    published: isPublished(content),
    slug,
  };
}

function scanContentState() {
  const sourceFiles = [
    ...SOURCE_DIRECTORIES.flatMap((dir) => collectFiles(dir, /\.(css|cjs|js|jsx|json|mjs|ts|tsx)$/i)),
    ...SOURCE_FILES,
  ].filter((filePath) => !EXCLUDED_SOURCE_FILES.has(filePath));

  return {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sourceFingerprint: hashFiles(sourceFiles),
    content: {
      articles: collectFiles(blogContentDir, /\.mdx?$/i).map(parseArticleFile).sort((left, right) => left.path.localeCompare(right.path)),
      aiBriefings: collectFiles(aiBriefingsDir, /\.md$/i)
        .map((file) => parseBriefingFile(file, "ai-briefing"))
        .filter((item) => item !== null)
        .sort((left, right) => left.path.localeCompare(right.path)),
      investmentBriefings: collectFiles(investmentBriefingsDir, /\.md$/i)
        .map((file) => parseBriefingFile(file, "investment-briefing"))
        .filter((item) => item !== null)
        .sort((left, right) => left.path.localeCompare(right.path)),
    },
  };
}

function diffItems(previousItems = [], currentItems = []) {
  const previousByPath = new Map(previousItems.map((item) => [item.path, item]));
  const currentByPath = new Map(currentItems.map((item) => [item.path, item]));
  const added = [];
  const modified = [];
  const removed = [];

  for (const current of currentItems) {
    const previous = previousByPath.get(current.path);
    if (!previous) {
      added.push(current);
    } else if (previous.hash !== current.hash) {
      modified.push({ previous, current });
    }
  }

  for (const previous of previousItems) {
    if (!currentByPath.has(previous.path)) {
      removed.push(previous);
    }
  }

  return { added, modified, removed };
}

function publishedItems(items) {
  return items.filter((item) => item.published);
}

function pageCountForArticles(items) {
  return Math.max(1, Math.ceil(publishedItems(items).length / POSTS_PER_PAGE));
}

function monthSet(items) {
  return new Set(publishedItems(items).map((item) => item.month));
}

function changedPublishedSlugs(diff) {
  return [
    ...diff.added.filter((item) => item.published).map((item) => item.slug),
    ...diff.modified.filter(({ current }) => current.published).map(({ current }) => current.slug),
  ];
}

function removedPublishedSlugs(diff) {
  return [
    ...diff.removed.filter((item) => item.published).map((item) => item.slug),
    ...diff.modified.filter(({ previous, current }) => previous.published && (!current.published || previous.slug !== current.slug)).map(({ previous }) => previous.slug),
  ];
}

function buildIncrementalRoutes(diff, currentItems) {
  const routes = changedPublishedSlugs(diff);
  if (publishedItems(currentItems).length > 0) {
    routes.push("latest");
  }

  return uniqueSorted(routes);
}

function buildPlan(previousState, currentState) {
  const articleDiff = diffItems(previousState?.content?.articles, currentState.content.articles);
  const aiBriefingDiff = diffItems(previousState?.content?.aiBriefings, currentState.content.aiBriefings);
  const investmentBriefingDiff = diffItems(previousState?.content?.investmentBriefings, currentState.content.investmentBriefings);
  const sourceChanged = previousState?.sourceFingerprint !== currentState.sourceFingerprint;
  const forceFull = process.env.FORCE_FULL_SITE_BUILD === "true" || process.env.SITE_FULL_BUILD === "true";
  const noPreviousState = !previousState || previousState.version !== VERSION;
  const mode = forceFull || noPreviousState || sourceChanged ? "full" : "incremental";
  const previousAiMonths = monthSet(previousState?.content?.aiBriefings ?? []);
  const currentAiMonths = monthSet(currentState.content.aiBriefings);
  const previousInvestmentMonths = monthSet(previousState?.content?.investmentBriefings ?? []);
  const currentInvestmentMonths = monthSet(currentState.content.investmentBriefings);

  return {
    version: VERSION,
    createdAt: new Date().toISOString(),
    mode,
    reasons: {
      forceFull,
      noPreviousState,
      sourceChanged,
    },
    routes: {
      articles: mode === "incremental" ? buildIncrementalRoutes(articleDiff, currentState.content.articles) : [],
      aiBriefings: mode === "incremental" ? buildIncrementalRoutes(aiBriefingDiff, currentState.content.aiBriefings) : [],
      investmentBriefings: mode === "incremental" ? buildIncrementalRoutes(investmentBriefingDiff, currentState.content.investmentBriefings) : [],
    },
    cleanup: {
      articleSlugs: uniqueSorted(removedPublishedSlugs(articleDiff)),
      aiBriefingDates: uniqueSorted(removedPublishedSlugs(aiBriefingDiff)),
      investmentBriefingDates: uniqueSorted(removedPublishedSlugs(investmentBriefingDiff)),
      articlePagesFrom: pageCountForArticles(previousState?.content?.articles ?? []),
      articlePagesTo: pageCountForArticles(currentState.content.articles),
      aiArchiveMonths: uniqueSorted(Array.from(previousAiMonths).filter((month) => !currentAiMonths.has(month))),
      investmentArchiveMonths: uniqueSorted(Array.from(previousInvestmentMonths).filter((month) => !currentInvestmentMonths.has(month))),
    },
    summary: {
      articles: summarizeDiff(articleDiff),
      aiBriefings: summarizeDiff(aiBriefingDiff),
      investmentBriefings: summarizeDiff(investmentBriefingDiff),
    },
    state: currentState,
  };
}

function summarizeDiff(diff) {
  return {
    added: diff.added.length,
    modified: diff.modified.length,
    removed: diff.removed.length,
  };
}

function removeIfExists(filePath) {
  fs.rmSync(filePath, { recursive: true, force: true });
}

function cleanFullDynamicOutput() {
  removeIfExists(path.join(DIST_DIR, "articles"));
  removeIfExists(path.join(DIST_DIR, "ai", "briefings"));
  removeIfExists(path.join(DIST_DIR, "investment", "briefings"));
}

function removeRouteOutput(basePath) {
  removeIfExists(`${basePath}.html`);
  removeIfExists(`${basePath}.txt`);
  removeIfExists(basePath);
}

function removeArchiveMonthOutput(rootDir, month) {
  const [year, monthNumber] = month.split("-");
  if (!year || !monthNumber) {
    return;
  }

  removeRouteOutput(path.join(rootDir, "archive", year, monthNumber));
}

function finalizeCleanup(plan) {
  for (const slug of plan.cleanup.articleSlugs) {
    removeRouteOutput(path.join(DIST_DIR, "articles", slug));
    removeIfExists(path.join(siteDir, "public", "ai-data", "articles", `${slug}.json`));
  }

  for (let page = plan.cleanup.articlePagesTo + 1; page <= plan.cleanup.articlePagesFrom; page += 1) {
    removeRouteOutput(path.join(DIST_DIR, "articles", "page", String(page)));
  }

  for (const date of plan.cleanup.aiBriefingDates) {
    removeRouteOutput(path.join(DIST_DIR, "ai", "briefings", date));
  }

  for (const date of plan.cleanup.investmentBriefingDates) {
    removeRouteOutput(path.join(DIST_DIR, "investment", "briefings", date));
  }

  for (const month of plan.cleanup.aiArchiveMonths) {
    removeArchiveMonthOutput(path.join(DIST_DIR, "ai", "briefings"), month);
  }

  for (const month of plan.cleanup.investmentArchiveMonths) {
    removeArchiveMonthOutput(path.join(DIST_DIR, "investment", "briefings"), month);
  }
}

function prepare() {
  const previousState = readJson(STATE_FILE);
  const currentState = scanContentState();
  const plan = buildPlan(previousState, currentState);

  writeJson(PLAN_FILE, plan);
  if (plan.mode === "full") {
    cleanFullDynamicOutput();
  }

  console.log(`Site build plan: ${plan.mode}`);
  console.log(`Reasons: ${JSON.stringify(plan.reasons)}`);
  console.log(`Plan file: ${repoRelativePath(PLAN_FILE)}`);
  return plan;
}

function finalize() {
  const plan = readJson(PLAN_FILE);
  if (!plan) {
    throw new Error(`Missing site build plan: ${PLAN_FILE}`);
  }

  finalizeCleanup(plan);
  writeJson(STATE_FILE, plan.state);
  console.log(`Site build state saved: ${repoRelativePath(STATE_FILE)}`);
}

function printUsage() {
  console.log("Usage: node scripts/site-build-plan.js <prepare|finalize>");
}

function main(argv = process.argv.slice(2)) {
  const command = argv[0];
  if (command === "prepare") {
    prepare();
    return;
  }

  if (command === "finalize") {
    finalize();
    return;
  }

  printUsage();
  process.exit(command ? 1 : 0);
}

module.exports = {
  PLAN_FILE,
  STATE_FILE,
  buildPlan,
  diffItems,
  finalize,
  prepare,
  scanContentState,
};

if (require.main === module) {
  main();
}
