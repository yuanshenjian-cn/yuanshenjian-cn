#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const BLOG_DIRECTORY = path.join(ROOT, "content", "blog");
const DEFAULT_SITE_URL = "https://yuanshenjian.cn";
const DEFAULT_POSTS_PER_PAGE = 12;
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const PURGE_BATCH_SIZE = 30;
const EMPTY_SHA = "0000000000000000000000000000000000000000";
const AI_BRIEFING_FILE_RE = /^content\/ai-briefings\/(?:\d{4}(?:\/\d{2}|-\d{2})\/)?(\d{4}-\d{2}-\d{2})-ai-briefing\.md$/;
const INVESTMENT_BRIEFING_FILE_RE = /^content\/investment-briefings\/(?:\d{4}(?:\/\d{2}|-\d{2})\/)?(\d{4}-\d{2}-\d{2})-investment-briefing\.md$/;
const ARTICLE_FILE_RE = /^content\/blog\/.+\/([^/]+)\.mdx?$/i;
const BLOG_CONTENT_PREFIX = "content/blog/";
const ARTICLE_SECTION_ROUTES = [
  { contentDir: "swd/ai-coding/ai-frontier", rootPath: "/ai", columnPath: "/ai/ai-frontier" },
  { contentDir: "swd/ai-coding/llm-family", rootPath: "/ai", columnPath: "/ai/llm-family" },
  { contentDir: "swd/ai-coding/claudecode", rootPath: "/ai", columnPath: "/ai/claudecode" },
  { contentDir: "swd/ai-coding/opencode", rootPath: "/ai", columnPath: "/ai/opencode" },
  { contentDir: "swd/ai-coding/codex", rootPath: "/ai", columnPath: "/ai/codex" },
  { contentDir: "swd/ai-coding/deepseek", rootPath: "/ai", columnPath: "/ai/deepseek" },
  { contentDir: "investment/beginner-investing", rootPath: "/investment", columnPath: "/investment/beginner-investing" },
  { contentDir: "health/drink-your-way-to-health", rootPath: "/health", columnPath: "/health/drink-your-way-to-health" },
  { contentDir: "health/eat-your-way-to-health", rootPath: "/health", columnPath: "/health/eat-your-way-to-health" },
  { contentDir: "health/diet-culture", rootPath: "/health", columnPath: "/health/diet-culture" },
];
const INVESTMENT_COVERAGE_RELATED_FILES = new Set([
  "site/app/investment/coverage/page.tsx",
  "site/components/investment/coverage-page-client.tsx",
  "site/lib/investment-config.ts",
  "site/public/investment-data/coverage.json",
  "scripts/build-investment-data.js",
  "skills/investment-briefing/config/briefing.json",
  "skills/investment-briefing/config/focus-areas.json",
  "skills/investment-briefing/config/focus-companies.json",
]);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function loadLocalEnvFiles() {
  loadEnvFile(path.join(ROOT, ".env"));
  loadEnvFile(path.join(ROOT, ".env.local"));
}

function unique(values) {
  return Array.from(new Set(values));
}

function normalizeRepoPath(filePath) {
  const relativePath = path.isAbsolute(filePath) ? path.relative(ROOT, filePath) : filePath;
  return relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function normalizeSiteUrl(rawSiteUrl) {
  const url = new URL(rawSiteUrl || DEFAULT_SITE_URL);
  return url.origin;
}

function toAbsoluteUrl(target, siteUrl) {
  if (/^https?:\/\//i.test(target)) {
    return new URL(target).toString();
  }

  const pathname = target.startsWith("/") ? target : `/${target}`;
  return new URL(pathname, `${siteUrl}/`).toString();
}

function buildAiBriefingListPaths() {
  return [
    "/",
    "/ai",
    "/ai/briefings",
    "/ai/briefings/archive",
    "/ai/briefings/latest",
    "/ai/briefings/latest/opengraph-image",
    "/ai-data/briefings/index.json",
    "/sitemap.xml",
  ];
}

function buildAiBriefingPurgePaths(date) {
  const [year, month] = date.split("-");

  return unique([
    ...buildAiBriefingListPaths(),
    `/ai/briefings/archive/${year}/${month}`,
    `/ai/briefings/${date}`,
    `/ai/briefings/${date}/opengraph-image`,
  ]);
}

function buildInvestmentBriefingListPaths() {
  return [
    "/",
    "/investment",
    "/investment/briefings",
    "/investment/briefings/archive",
    "/investment/briefings/latest",
    "/investment/briefings/latest/opengraph-image",
    "/investment/coverage",
    "/investment-data/briefings/index.json",
    "/sitemap.xml",
  ];
}

function buildInvestmentCoveragePaths() {
  return [
    "/investment/coverage",
    "/investment-data/coverage.json",
  ];
}

function buildInvestmentBriefingPurgePaths(date) {
  const [year, month] = date.split("-");

  return unique([
    ...buildInvestmentBriefingListPaths(),
    `/investment/briefings/archive/${year}/${month}`,
    `/investment/briefings/${date}`,
    `/investment/briefings/${date}/opengraph-image`,
  ]);
}

function getMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return getMarkdownFiles(fullPath);
    }

    return /\.mdx?$/i.test(entry.name) ? [fullPath] : [];
  });
}

function extractFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return "";
  }

  const closingIndex = content.indexOf("\n---", 4);
  if (closingIndex === -1) {
    return "";
  }

  return content.slice(4, closingIndex);
}

function isPublishedArticle(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    return true;
  }

  const publishedMatch = frontmatter.match(/^published:\s*(.+)\s*$/m);
  if (!publishedMatch) {
    return true;
  }

  const publishedValue = publishedMatch[1].trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  return publishedValue !== "false";
}

function getPublishedArticlePageCount() {
  const publishedPosts = getMarkdownFiles(BLOG_DIRECTORY).filter(isPublishedArticle).length;

  return Math.max(1, Math.ceil(publishedPosts / DEFAULT_POSTS_PER_PAGE));
}

function buildArticlePurgePaths(slug, articlePageCount = getPublishedArticlePageCount()) {
  const paths = [
    "/",
    "/articles",
    "/articles/latest",
    `/articles/${slug}`,
    "/feed",
    "/sitemap.xml",
    "/ai-data/index.json",
    `/ai-data/articles/${slug}.json`,
  ];

  for (let page = 2; page <= articlePageCount; page += 1) {
    paths.push(`/articles/page/${page}`);
  }

  return unique(paths);
}

function getArticleSectionPaths(filePath) {
  if (!filePath.startsWith(BLOG_CONTENT_PREFIX)) {
    return [];
  }

  const relativeContentPath = filePath.slice(BLOG_CONTENT_PREFIX.length);
  const matchedSection = ARTICLE_SECTION_ROUTES.find(({ contentDir }) => {
    const prefix = contentDir.endsWith("/") ? contentDir : `${contentDir}/`;
    return relativeContentPath.startsWith(prefix);
  });

  if (!matchedSection) {
    return [];
  }

  return [matchedSection.rootPath, matchedSection.columnPath];
}

function derivePurgePathsFromChangedFiles(changedFiles, options = {}) {
  const articlePageCount = options.articlePageCount ?? getPublishedArticlePageCount();
  const pathSet = new Set();

  for (const rawFilePath of changedFiles) {
    const filePath = normalizeRepoPath(rawFilePath);
    let match = AI_BRIEFING_FILE_RE.exec(filePath);
    if (match) {
      for (const targetPath of buildAiBriefingPurgePaths(match[1])) {
        pathSet.add(targetPath);
      }
      continue;
    }

    match = INVESTMENT_BRIEFING_FILE_RE.exec(filePath);
    if (match) {
      for (const targetPath of buildInvestmentBriefingPurgePaths(match[1])) {
        pathSet.add(targetPath);
      }
      continue;
    }

    match = ARTICLE_FILE_RE.exec(filePath);
    if (match) {
      for (const targetPath of buildArticlePurgePaths(match[1], articlePageCount)) {
        pathSet.add(targetPath);
      }

      for (const targetPath of getArticleSectionPaths(filePath)) {
        pathSet.add(targetPath);
      }

      continue;
    }

    if (filePath === "public/ai-data/briefings/index.json") {
      for (const targetPath of buildAiBriefingListPaths()) {
        pathSet.add(targetPath);
      }
      continue;
    }

    if (filePath === "public/investment-data/briefings/index.json") {
      for (const targetPath of buildInvestmentBriefingListPaths()) {
        pathSet.add(targetPath);
      }
      continue;
    }

    if (INVESTMENT_COVERAGE_RELATED_FILES.has(filePath)) {
      for (const targetPath of buildInvestmentCoveragePaths()) {
        pathSet.add(targetPath);
      }
      continue;
    }

    if (filePath === "public/ai-data/index.json") {
      for (const targetPath of ["/articles", "/articles/latest", "/feed", "/sitemap.xml", "/ai-data/index.json"]) {
        pathSet.add(targetPath);
      }
    }
  }

  return Array.from(pathSet).sort();
}

function parseArgs(argv) {
  const options = {
    changedFiles: [],
    dryRun: false,
    date: null,
    help: false,
    scope: null,
    siteUrl: null,
    slug: null,
    urls: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    const nextValue = argv[index + 1];
    if ((arg === "--scope" || arg === "--date" || arg === "--slug" || arg === "--changed-file" || arg === "--url" || arg === "--site-url") && !nextValue) {
      throw new Error(`${arg} 缺少参数值`);
    }

    switch (arg) {
      case "--scope":
        options.scope = nextValue;
        index += 1;
        break;
      case "--date":
        options.date = nextValue;
        index += 1;
        break;
      case "--slug":
        options.slug = nextValue;
        index += 1;
        break;
      case "--changed-file":
        options.changedFiles.push(nextValue);
        index += 1;
        break;
      case "--url":
        options.urls.push(nextValue);
        index += 1;
        break;
      case "--site-url":
        options.siteUrl = nextValue;
        index += 1;
        break;
      default:
        throw new Error(`不支持的参数：${arg}`);
    }
  }

  return options;
}

function chunk(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function formatCloudflareErrors(errors) {
  if (!Array.isArray(errors) || errors.length === 0) {
    return "未知错误";
  }

  return errors.map((error) => error.message || JSON.stringify(error)).join("; ");
}

async function purgeCloudflareUrls(urls, { apiToken, zoneId }) {
  for (const batch of chunk(urls, PURGE_BATCH_SIZE)) {
    const response = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ files: batch }),
    });

    const payload = await response.json();
    if (!response.ok || payload.success !== true) {
      throw new Error(`Cloudflare purge 失败：${formatCloudflareErrors(payload.errors)}`);
    }

    console.log(`Cloudflare purge success (${batch.length} URLs)`);
  }
}

function printUsage() {
  console.log(`用法：
  npm run purge:cloudflare -- --scope ai-briefing --date 2026-05-26
  npm run purge:cloudflare -- --scope investment-briefing --date 2026-05-26
  npm run purge:cloudflare -- --scope article --slug opencode-efficiency-config-handbook
  npm run purge:cloudflare -- --scope deploy --changed-file content/ai-briefings/2026-05-26-ai-briefing.md
  npm run purge:cloudflare -- --url https://yuanshenjian.cn/ --url /ai/briefings/latest

环境变量：
  CLOUDFLARE_API_TOKEN
  CLOUDFLARE_ZONE_ID
  NEXT_PUBLIC_SITE_URL (可选，默认 https://yuanshenjian.cn)
`);
}

function buildTargetUrls(options) {
  const siteUrl = normalizeSiteUrl(options.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL);
  const targetPaths = [];

  switch (options.scope) {
    case null:
    case undefined:
      break;
    case "ai-briefing":
      if (!options.date) {
        throw new Error("--scope ai-briefing 需要同时传入 --date YYYY-MM-DD");
      }
      targetPaths.push(...buildAiBriefingPurgePaths(options.date));
      break;
    case "investment-briefing":
      if (!options.date) {
        throw new Error("--scope investment-briefing 需要同时传入 --date YYYY-MM-DD");
      }
      targetPaths.push(...buildInvestmentBriefingPurgePaths(options.date));
      break;
    case "article":
      if (!options.slug) {
        throw new Error("--scope article 需要同时传入 --slug");
      }
      targetPaths.push(...buildArticlePurgePaths(options.slug));
      break;
    case "deploy":
      targetPaths.push(...derivePurgePathsFromChangedFiles(options.changedFiles));
      break;
    default:
      throw new Error(`不支持的 scope：${options.scope}`);
  }

  const urls = [
    ...targetPaths.map((targetPath) => toAbsoluteUrl(targetPath, siteUrl)),
    ...options.urls.map((targetUrl) => toAbsoluteUrl(targetUrl, siteUrl)),
  ];

  return unique(urls).sort();
}

async function main(argv = process.argv.slice(2)) {
  loadLocalEnvFiles();
  const options = parseArgs(argv);

  if (options.help) {
    printUsage();
    return;
  }

  if (options.scope === "deploy" && process.env.GITHUB_EVENT_BEFORE === EMPTY_SHA && options.changedFiles.length === 0) {
    console.log("No deploy diff available, skip Cloudflare purge.");
    return;
  }

  const urls = buildTargetUrls(options);
  if (urls.length === 0) {
    console.log("No Cloudflare cache purge targets derived.");
    return;
  }

  console.log("Cloudflare purge targets:");
  for (const url of urls) {
    console.log(`- ${url}`);
  }

  if (options.dryRun) {
    console.log("Dry run only, skip Cloudflare API call.");
    return;
  }

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const missingVariables = [];
  if (!apiToken) {
    missingVariables.push("CLOUDFLARE_API_TOKEN");
  }
  if (!zoneId) {
    missingVariables.push("CLOUDFLARE_ZONE_ID");
  }

  if (missingVariables.length > 0) {
    throw new Error(`缺少 Cloudflare 环境变量：${missingVariables.join(", ")}`);
  }

  await purgeCloudflareUrls(urls, { apiToken, zoneId });
}

module.exports = {
  buildAiBriefingPurgePaths,
  buildArticlePurgePaths,
  buildInvestmentBriefingPurgePaths,
  buildInvestmentCoveragePaths,
  buildTargetUrls,
  derivePurgePathsFromChangedFiles,
  getArticleSectionPaths,
  normalizeRepoPath,
  parseArgs,
  toAbsoluteUrl,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
