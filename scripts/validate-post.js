#!/usr/bin/env node

// @ts-check

/**
 * validate-post.js
 *
 * 用法：
 *   npm run validate-content
 *     校验 content/blog 下所有 .md/.mdx 内容，以及 content/ai-briefings、content/investment-briefings 下所有 .md 简报。
 *
 *   npm run validate-post -- --check-path "content/blog/swd/foo.md"
 *     仅校验路径合法性和 slug 唯一性。
 *
 *   npm run validate-post -- "content/blog/swd/foo.md"
 *     校验单篇文章的路径、frontmatter、内链和图片。
 *
 *   npm run validate-post -- --strict-writing "content/blog/swd/foo.md"
 *     在完整校验基础上，额外检查新文章写作规范。
 */

const fs = require("fs");
const path = require("path");
const { loadAiBriefingSkillConfig, loadInvestmentBriefingSkillConfig } = require("./briefing-skill-config.js");
const { repoRoot, contentDir, blogContentDir, aiBriefingsDir, investmentBriefingsDir, sitePublicDir } = require("../config/workspace-paths.js");

const ROOT = repoRoot;
const CONTENT_ROOT = blogContentDir;
const BRIEFINGS_ROOT = aiBriefingsDir;
const INVESTMENT_BRIEFINGS_ROOT = investmentBriefingsDir;
const MARKDOWN_EXT_RE = /\.mdx?$/i;
const BRIEFING_EXT_RE = /\.md$/i;
const DEFAULT_AI_BRIEFING_CONFIG = {
  bodyLengthRules: [
    {
      effectiveFrom: "0000-01-01",
      min: 700,
      max: 1100,
      label: "legacy",
    },
    {
      effectiveFrom: "2026-05-26",
      min: 900,
      max: 1300,
      label: "v2",
    },
  ],
  dedupeLookbackIssues: 5,
  dedupeEffectiveFrom: "2026-05-14",
  requiredSections: ["速览", "重点动态", "为什么值得关注", "来源"],
  dedupeSectionHeading: "重点动态",
  sourceSectionHeading: "来源",
};
const DEFAULT_INVESTMENT_BRIEFING_CONFIG = {
  bodyLengthRules: [
    {
      effectiveFrom: "0000-01-01",
      shortMin: 900,
      normalMin: 1200,
      normalMax: 1500,
      label: "legacy",
    },
    {
      effectiveFrom: "2026-05-26",
      shortMin: 1100,
      normalMin: 1400,
      normalMax: 1700,
      label: "v2",
    },
  ],
  dedupeLookbackIssues: 5,
  dedupeEffectiveFrom: "2026-05-14",
  confirmSectionHeading: "近 24 小时确认动态",
  watchSectionHeading: "未来重点观察",
  sourceSectionHeading: "来源",
  disclaimer: "**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**",
};
const INVESTMENT_REDLINE_RE = /(值得买入|建议加仓|目标价|推荐买入|推荐关注|仓位|上车|抄底|止盈|止损|强推|配置价值|买入|卖出|加仓|减仓|建仓|看多|看空|增持|跑赢大市|弹性空间|持有)/;
const INVESTMENT_PROCESS_LEAK_PATTERNS = [
  /(?:本期|这期)重点是把[^。；\n]*/,
  /而不是追逐[^。；\n]*/,
  /(?:暂不纳入本期|未纳入本期|为什么没纳入)/,
];
const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const OLD_ARTICLE_DATE_LINK_RE = /\]\(\/articles\/\d{4}\/\d{2}\/\d{2}\//g;
const OLD_BLOG_LINK_RE = /\]\(\/blog\//g;
const GENERIC_ALT_RE = /^\s*(|image|alt text|图片)\s*$/i;
const MARKDOWN_IMAGE_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;
const MARKDOWN_LINK_RE = /(?<!!)\[[^\]]+\]\(([^)\s]+)(?:\s+['"][^'"]*['"])?\)/g;

/** @type {string[]} */
const args = process.argv.slice(2);
let checkPathOnly = false;
let strictWriting = false;
/** @type {string | null} */
let targetPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--check-path") {
    checkPathOnly = true;
    targetPath = args[i + 1];
    i++;
  } else if (args[i] === "--strict-writing") {
    strictWriting = true;
  } else if (!args[i].startsWith("-")) {
    targetPath = args[i];
  }
}

if (checkPathOnly && !targetPath) {
  console.error("❌ --check-path 需要提供目标文件路径");
  process.exit(1);
}

/** @type {{ file?: string; line?: number; message: string }[]} */
const errors = [];

/** @type {{ name: string; aliases?: string[] }[]} */
let aiFocusCompanies = [];

let aiBriefingConfig = { ...DEFAULT_AI_BRIEFING_CONFIG };
let investmentBriefingConfig = { ...DEFAULT_INVESTMENT_BRIEFING_CONFIG };

/** @type {{ name: string; aliases?: string[] }[]} */
let investmentBlockedCompanies = [];

try {
  const aiSkillConfig = loadAiBriefingSkillConfig();
  aiBriefingConfig = {
    ...DEFAULT_AI_BRIEFING_CONFIG,
    ...(aiSkillConfig.briefing ?? {}),
  };
  aiFocusCompanies = Array.isArray(aiSkillConfig.focusCompanies) ? aiSkillConfig.focusCompanies : [];
} catch (error) {
  console.warn("[validate-post] Failed to load AI briefing skill config:", error);
}

try {
  const investmentSkillConfig = loadInvestmentBriefingSkillConfig();
  investmentBriefingConfig = {
    ...DEFAULT_INVESTMENT_BRIEFING_CONFIG,
    ...(investmentSkillConfig.briefing ?? {}),
  };
  investmentBlockedCompanies = Array.isArray(investmentSkillConfig.blockedCompanies)
    ? investmentSkillConfig.blockedCompanies
    : [];
} catch (error) {
  console.warn("[validate-post] Failed to load investment briefing skill config:", error);
}

/**
 * @param {string} message
 * @param {string} [file]
 * @param {number} [line]
 */
function addError(message, file, line) {
  errors.push({ file, line, message });
}

/** @param {string} value */
function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

/**
 * @param {string} content
 * @param {number} index
 */
function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

/** @param {string} markdown */
function toPlainBriefingText(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^>+\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/(^|\s)#{1,6}\s+/gm, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** @param {string} value */
function normalizeComparableText(value) {
  return toPlainBriefingText(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "")
    .trim();
}

/** @param {{ name: string; aliases?: string[] }[]} companies */
function buildGenericHeadingSet(companies) {
  return new Set(
    companies
      .flatMap((company) => [company.name, ...(Array.isArray(company.aliases) ? company.aliases : [])])
      .filter((value) => typeof value === "string" && value.trim().length > 0)
      .map((value) => normalizeComparableText(value)),
  );
}

/**
 * @param {string} dateText
 */
function getWeekdayNameForDate(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(utcDate.getTime())) return null;
  return WEEKDAY_NAMES[utcDate.getUTCDay()] ?? null;
}

/**
 * @param {string} year
 * @param {string} month
 * @param {string} day
 */
function formatDateParts(year, month, day) {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

/**
 * @template {{ effectiveFrom: string }} T
 * @param {string} dateText
 * @param {T[] | undefined} configuredRules
 * @param {T[]} fallbackRules
 */
function resolveEffectiveRule(dateText, configuredRules, fallbackRules) {
  const candidateRules = Array.isArray(configuredRules) && configuredRules.length > 0
    ? configuredRules
    : fallbackRules;

  const sortedRules = candidateRules
    .filter((rule) => rule && typeof rule.effectiveFrom === "string")
    .sort((left, right) => left.effectiveFrom.localeCompare(right.effectiveFrom));

  if (sortedRules.length === 0) {
    return fallbackRules[fallbackRules.length - 1];
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return sortedRules[sortedRules.length - 1];
  }

  let matchedRule = sortedRules[0];
  for (const rule of sortedRules) {
    if (rule.effectiveFrom <= dateText) {
      matchedRule = rule;
      continue;
    }

    break;
  }

  return matchedRule;
}

/**
 * @param {string} dateText
 */
function resolveAiBodyLengthRule(dateText) {
  return resolveEffectiveRule(
    dateText,
    aiBriefingConfig.bodyLengthRules,
    DEFAULT_AI_BRIEFING_CONFIG.bodyLengthRules,
  );
}

/**
 * @param {string} dateText
 */
function resolveInvestmentBodyLengthRule(dateText) {
  return resolveEffectiveRule(
    dateText,
    investmentBriefingConfig.bodyLengthRules,
    DEFAULT_INVESTMENT_BRIEFING_CONFIG.bodyLengthRules,
  );
}

/**
 * @param {unknown} value
 * @param {number} fallback
 */
function toNumberOr(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * @param {{ min?: number; max?: number }} rule
 */
function normalizeAiBodyLengthRule(rule) {
  return {
    min: toNumberOr(rule.min, DEFAULT_AI_BRIEFING_CONFIG.bodyLengthRules[DEFAULT_AI_BRIEFING_CONFIG.bodyLengthRules.length - 1].min),
    max: toNumberOr(rule.max, DEFAULT_AI_BRIEFING_CONFIG.bodyLengthRules[DEFAULT_AI_BRIEFING_CONFIG.bodyLengthRules.length - 1].max),
  };
}

/**
 * @param {{ shortMin?: number; normalMin?: number; normalMax?: number }} rule
 */
function normalizeInvestmentBodyLengthRule(rule) {
  const fallbackRule = DEFAULT_INVESTMENT_BRIEFING_CONFIG.bodyLengthRules[DEFAULT_INVESTMENT_BRIEFING_CONFIG.bodyLengthRules.length - 1];

  return {
    shortMin: toNumberOr(rule.shortMin, fallbackRule.shortMin),
    normalMin: toNumberOr(rule.normalMin, fallbackRule.normalMin),
    normalMax: toNumberOr(rule.normalMax, fallbackRule.normalMax),
  };
}

/**
 * @param {string} body
 */
function findInvestmentWeekdayMismatches(body) {
  /** @type {{ text: string; expectedWeekday: string; line: number }[]} */
  const mismatches = [];
  const patterns = [
    /(?<!\d)(\d{4})-(\d{2})-(\d{2})（(周[日一二三四五六])）/g,
    /(?<!\d)(\d{1,2})\s*月\s*(\d{1,2})\s*日（(周[日一二三四五六])）/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      const matchedText = match[0];
      const actualWeekday = match[pattern === patterns[0] ? 4 : 3];
      const dateText = pattern === patterns[0]
        ? formatDateParts(match[1], match[2], match[3])
        : formatDateParts("2026", match[1], match[2]);
      const expectedWeekday = getWeekdayNameForDate(dateText);

      if (expectedWeekday && actualWeekday !== expectedWeekday) {
        mismatches.push({
          text: matchedText,
          expectedWeekday,
          line: getLineNumber(body, match.index),
        });
      }
    }
  }

  return mismatches;
}

/** @param {string} content */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return {
    raw: match[1],
    body: content.slice(match[0].length),
  };
}

/** @param {string} content */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

/** @param {string} content */
function maskFencedCodeBlocks(content) {
  return content.replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2[^\n]*(?=\n|$)/g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
}

/** @param {string} value */
function unquote(value) {
  return value.trim().replace(/^["']|["']$/g, "");
}

/**
 * @param {string} yaml
 * @param {string} key
 */
function extractField(yaml, key) {
  const singleLine = new RegExp(`^${key}:\\s*(.+)$`, "m");
  const match = yaml.match(singleLine);
  return match ? match[1].trim() : null;
}

/**
 * @param {string} yaml
 * @param {string} key
 * @returns {string[] | null}
 */
function extractArrayField(yaml, key) {
  const singleLine = new RegExp(`^${key}:\\s*\\[(.+)\\]`, "m");
  const singleLineMatch = yaml.match(singleLine);
  if (singleLineMatch) {
    return singleLineMatch[1].match(/["']([^"']+)["']/g)?.map(unquote) ?? [];
  }

  const block = new RegExp(`^${key}:[^\\S\\r\\n]*\\r?\\n((?:[^\\S\\r\\n]*-[^\\r\\n]*\\r?\\n?)+)`, "m");
  const blockMatch = yaml.match(block);
  if (!blockMatch) return null;
  return blockMatch[1]
    .trim()
    .split(/\r?\n/)
    .map((line) => unquote(line.replace(/^[^\S\r\n]*-[^\S\r\n]*/, "").trim()));
}

/** @param {string} yaml */
function extractBrief(yaml) {
  const fold = yaml.match(/^brief:\s*[>|][-+]?\s*\r?\n((?:[^\S\r\n]+[^\r\n]*\r?\n?)+)/m);
  if (fold) return fold[1].replace(/\s+/g, " ").trim();

  const quoted = yaml.match(/^brief:\s*["'](.+?)["']\s*$/m);
  if (quoted) return quoted[1].trim();

  const plain = yaml.match(/^brief:\s*([^>|'"\r\n].*?)\s*$/m);
  if (plain) return plain[1].trim();

  return null;
}

/** @param {string} dir */
function getMarkdownFiles(dir) {
  /** @type {string[]} */
  const files = [];
  if (!fs.existsSync(dir)) return files;

  /** @param {string} currentDir */
  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && MARKDOWN_EXT_RE.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files.sort();
}

/** @param {string[]} files */
function collectSlugUsage(files) {
  /** @type {Map<string, string[]>} */
  const slugs = new Map();
  for (const file of files) {
    const slug = path.basename(file).replace(MARKDOWN_EXT_RE, "");
    const relativePath = toPosixPath(path.relative(ROOT, file));
    const paths = slugs.get(slug) ?? [];
    paths.push(relativePath);
    slugs.set(slug, paths);
  }
  return slugs;
}

/** @param {string} filePath */
function validateContentPath(filePath) {
  const normalizedTarget = filePath.replace(/\\/g, "/");
  const absolutePath = path.resolve(ROOT, filePath);
  const isBlogPath = normalizedTarget.startsWith("content/blog/") || normalizedTarget.startsWith("./content/blog/");
  const isBriefingPath = normalizedTarget.startsWith("content/ai-briefings/") || normalizedTarget.startsWith("./content/ai-briefings/");
  const isInvestmentBriefingPath = normalizedTarget.startsWith("content/investment-briefings/") || normalizedTarget.startsWith("./content/investment-briefings/");
  const contentRoot = isBriefingPath
    ? BRIEFINGS_ROOT
    : isInvestmentBriefingPath
      ? INVESTMENT_BRIEFINGS_ROOT
      : CONTENT_ROOT;
  const relativeToContentRoot = path.relative(contentRoot, absolutePath);

  if (isBriefingPath && !BRIEFING_EXT_RE.test(filePath)) {
    addError(`AI 简报文件扩展名必须是 .md（当前：${path.extname(filePath) || "无扩展名"}）`, filePath);
  } else if (!MARKDOWN_EXT_RE.test(filePath)) {
    addError(`文件扩展名必须是 .md 或 .mdx（当前：${path.extname(filePath) || "无扩展名"}）`, filePath);
  }

  if (!isBlogPath && !isBriefingPath && !isInvestmentBriefingPath) {
    addError(`路径必须位于 content/blog/、content/ai-briefings/ 或 content/investment-briefings/ 下（当前：${filePath}）`, filePath);
  }

  if (relativeToContentRoot.startsWith("..") || path.isAbsolute(relativeToContentRoot)) {
    addError(`解析后的路径不在允许的内容目录下（当前：${filePath}）`, filePath);
  }

  const targetDir = path.dirname(absolutePath);
  if (!fs.existsSync(targetDir)) {
    addError(`目标目录不存在：${toPosixPath(path.relative(ROOT, targetDir))}`, filePath);
  }

  return absolutePath;
}

/**
 * @param {string} href
 * @param {string} articlePath
 */
function resolveLocalImagePath(href, articlePath) {
  if (/^(https?:)?\/\//i.test(href) || href.startsWith("data:") || href.startsWith("#")) {
    return null;
  }

  const cleanHref = href.split(/[?#]/)[0];
  if (!cleanHref) return null;

  if (cleanHref.startsWith("/")) {
    return path.join(sitePublicDir, cleanHref);
  }

  return path.resolve(path.dirname(articlePath), cleanHref);
}

/**
 * @param {string} href
 * @param {Set<string>} slugs
 */
function isBareLegacyArticleLink(href, slugs) {
  if (!href.startsWith("/")) return false;
  if (/^\/(articles|ai|resume|about|feed|images|icons|docs)(\/|$)/.test(href)) return false;
  const cleanHref = href.split(/[?#]/)[0].replace(/\/$/, "");
  const lastSegment = cleanHref.split("/").filter(Boolean).pop();
  return Boolean(lastSegment && slugs.has(lastSegment));
}

/**
 * @param {string} body
 * @param {string} file
 * @param {Set<string>} slugs
 */
function validateLinksAndImages(body, file, slugs) {
  const prose = maskFencedCodeBlocks(body);
  const relativeFile = toPosixPath(path.relative(ROOT, file));

  for (const match of prose.matchAll(OLD_ARTICLE_DATE_LINK_RE)) {
    addError("旧文章日期内链应改为 /articles/<slug>", relativeFile, getLineNumber(prose, match.index ?? 0));
  }

  for (const match of prose.matchAll(OLD_BLOG_LINK_RE)) {
    addError("旧 /blog/ 内链应改为 /articles/<slug>", relativeFile, getLineNumber(prose, match.index ?? 0));
  }

  for (const match of prose.matchAll(MARKDOWN_LINK_RE)) {
    const href = match[1];
    if (isBareLegacyArticleLink(href, slugs)) {
      addError(`疑似旧文章裸路径内链：${href}`, relativeFile, getLineNumber(prose, match.index ?? 0));
    }
  }

  for (const match of prose.matchAll(MARKDOWN_IMAGE_RE)) {
    const alt = match[1];
    const href = match[2];
    const line = getLineNumber(prose, match.index ?? 0);

    if (GENERIC_ALT_RE.test(alt)) {
      addError(`图片 alt 不能为空或泛化描述（当前：${alt || "空"}）`, relativeFile, line);
    }

    const imagePath = resolveLocalImagePath(href, file);
    if (imagePath && !fs.existsSync(imagePath)) {
      addError(`本地图片不存在：${href}`, relativeFile, line);
    }
  }
}

/**
 * @param {string} body
 * @param {string} file
 */
function validateWritingRules(body, file) {
  const prose = maskFencedCodeBlocks(body);
  const relativeFile = toPosixPath(path.relative(ROOT, file));
  const forbiddenPhrases = [
    "总的来说",
    "综上所述",
    "值得一提的是",
    "值得注意的是",
    "深入探讨",
    "全面分析",
    "深度解析",
    "至关重要",
    "尤为重要",
    "不可或缺",
    "不难发现",
    "由此可见",
    "可以说",
    "可谓",
    "毋庸置疑",
    "本文将",
    "接下来我们将",
    "多维度分析",
    "重新定义",
    "颠覆式",
    "划时代",
  ];

  const levelOneHeading = prose.match(/^#\s+/m);
  if (levelOneHeading) {
    addError("正文不能出现一级标题 '# '，文章标题只放在 frontmatter.title", relativeFile, getLineNumber(prose, levelOneHeading.index ?? 0));
  }

  const separator = prose.match(/^\s*---\s*$/m);
  if (separator) {
    addError("正文不能使用独立的 '---' 章节分割线", relativeFile, getLineNumber(prose, separator.index ?? 0));
  }

  const mdxSyntax = prose.match(/\bclassName\s*=|^import\s.+from\s+["'].+["'];?$|^export\s+|<[A-Z][A-Za-z0-9]*(\s|>|\/>)/m);
  if (mdxSyntax) {
    addError("正文疑似包含 MDX/JSX 语法；博客文章只能使用普通 Markdown", relativeFile, getLineNumber(prose, mdxSyntax.index ?? 0));
  }

  for (const phrase of forbiddenPhrases) {
    const index = prose.indexOf(phrase);
    if (index >= 0) {
      addError(`正文包含禁用短语："${phrase}"`, relativeFile, getLineNumber(prose, index));
    }
  }
}

/** @param {string} body */
function countChineseCharacters(body) {
  return (maskFencedCodeBlocks(body).match(/[\u4e00-\u9fff]/g) ?? []).length;
}

/**
 * @param {string} body
 * @param {string[]} headings
 */
function removeSections(body, headings) {
  let result = body;

  for (const heading of headings) {
    const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const sectionMatch = result.match(new RegExp(`^##\\s+${escapedHeading}\\s*$[\\s\\S]*?(?=^##\\s+|$)`, "m"));
    if (sectionMatch) {
      result = result.replace(sectionMatch[0], "").trim();
    }
  }

  return result;
}

/** @param {string} text */
function detectBlockedInvestmentCompany(text) {
  for (const company of investmentBlockedCompanies) {
    const candidates = [company.name, ...(Array.isArray(company.aliases) ? company.aliases : [])]
      .filter((value) => typeof value === "string" && value.trim().length > 0);

    for (const candidate of candidates) {
      if (text.includes(candidate)) {
        return company.name;
      }
    }
  }

  return null;
}

/**
 * @param {string} file
 * @param {Set<string>} slugs
 */
function validatePostFile(file, slugs) {
  const relativeFile = toPosixPath(path.relative(ROOT, file));
  const content = fs.readFileSync(file, "utf-8");
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    addError("未找到 frontmatter（文章必须以 --- 开头并包含 frontmatter）", relativeFile, 1);
    return;
  }

  const title = extractField(parsed.raw, "title");
  if (!title || unquote(title) === "" || title === "null") {
    addError("frontmatter 缺少 title 或 title 为空", relativeFile, 1);
  }

  const date = extractField(parsed.raw, "date");
  if (!date) {
    addError("frontmatter 缺少 date", relativeFile, 1);
  } else {
    const dateClean = unquote(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateClean)) {
      addError(`date 格式不合法（应为 YYYY-MM-DD，当前：${dateClean}）`, relativeFile, 1);
    } else if (Number.isNaN(new Date(dateClean).getTime())) {
      addError(`date 不是合法日期：${dateClean}`, relativeFile, 1);
    }
  }

  const tags = extractArrayField(parsed.raw, "tags");
  if (!tags || tags.length === 0) {
    addError("frontmatter 缺少 tags 或 tags 为空数组", relativeFile, 1);
  } else if (tags.some((tag) => tag.trim() === "")) {
    addError("tags 中存在空字符串项", relativeFile, 1);
  }

  const publishedRaw = extractField(parsed.raw, "published");
  const published = publishedRaw === null ? true : unquote(publishedRaw) !== "false";
  if (publishedRaw === null) {
    addError("frontmatter 缺少 published；草稿必须显式设置 published: false", relativeFile, 1);
  } else if (!["true", "false"].includes(unquote(publishedRaw))) {
      addError(`published 必须是布尔值（true 或 false），当前：${publishedRaw}`, relativeFile, 1);
  }

  const brief = extractBrief(parsed.raw);
  if (published && !brief) {
    addError("已发布文章缺少 brief 或 brief 为空", relativeFile, 1);
  }

  validateLinksAndImages(parsed.body, file, slugs);

  if (strictWriting) {
    validateWritingRules(stripFrontmatter(content), file);
  }
}

/**
 * @param {string} file
 * @param {Set<string>} slugs
 */
function validateBriefingFile(file, slugs) {
  const relativeFile = toPosixPath(path.relative(ROOT, file));
  const content = fs.readFileSync(file, "utf-8");
  const parsed = parseFrontmatter(content);
  const genericAiHeadingSet = buildGenericHeadingSet(aiFocusCompanies);

  if (!parsed) {
    addError("未找到 frontmatter（简报必须以 --- 开头并包含 frontmatter）", relativeFile, 1);
    return;
  }

  if (!BRIEFING_EXT_RE.test(file)) {
    addError("AI 简报必须使用 .md 文件", relativeFile, 1);
  }

  const title = extractField(parsed.raw, "title");
  if (!title || unquote(title) === "" || title === "null") {
    addError("frontmatter 缺少 title 或 title 为空", relativeFile, 1);
  }

  const date = extractField(parsed.raw, "date");
  let dateClean = "";
  if (!date) {
    addError("frontmatter 缺少 date", relativeFile, 1);
  } else {
    dateClean = unquote(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateClean)) {
      addError(`date 格式不合法（应为 YYYY-MM-DD，当前：${dateClean}）`, relativeFile, 1);
    } else if (Number.isNaN(new Date(dateClean).getTime())) {
      addError(`date 不是合法日期：${dateClean}`, relativeFile, 1);
    }
  }

  const tags = extractArrayField(parsed.raw, "tags");
  if (!tags || tags.length === 0) {
    addError("frontmatter 缺少 tags 或 tags 为空数组", relativeFile, 1);
  }

  const publishedRaw = extractField(parsed.raw, "published");
  if (publishedRaw === null) {
    addError("AI 简报必须显式设置 published: true", relativeFile, 1);
  } else if (unquote(publishedRaw) !== "true") {
    addError(`AI 简报 published 必须为 true（当前：${publishedRaw}）`, relativeFile, 1);
  }

  const brief = extractBrief(parsed.raw);
  if (!brief) {
    addError("frontmatter 缺少 brief 或 brief 为空", relativeFile, 1);
  }

  const requiredSections = Array.isArray(aiBriefingConfig.requiredSections)
    ? aiBriefingConfig.requiredSections
    : DEFAULT_AI_BRIEFING_CONFIG.requiredSections;
  for (const section of requiredSections) {
    if (!findHeading(parsed.body, section)) {
      addError(`AI 简报缺少 \`## ${section}\` 章节`, relativeFile, 1);
    }
  }

  const sourceSectionHeading = aiBriefingConfig.sourceSectionHeading || DEFAULT_AI_BRIEFING_CONFIG.sourceSectionHeading;
  const sourceSectionContent = getSectionContent(parsed.body, sourceSectionHeading);
  if (sourceSectionContent.length === 0 || !/https?:\/\//.test(sourceSectionContent)) {
    addError("AI 简报的 `## 来源` 章节必须包含至少一个可追溯来源链接", relativeFile, 1);
  }

  const chineseCharacters = countChineseCharacters(removeSections(parsed.body, [sourceSectionHeading]));
  const aiBodyRange = normalizeAiBodyLengthRule(resolveAiBodyLengthRule(dateClean));

  if (chineseCharacters < aiBodyRange.min || chineseCharacters > aiBodyRange.max) {
    addError(
      `AI 简报正文汉字数（不含来源章节）应为 ${aiBodyRange.min}~${aiBodyRange.max}（当前：${chineseCharacters}）`,
      relativeFile,
      1,
    );
  }

  if (dateClean) {
    validateRecentBriefingDuplicates(
      file,
      dateClean,
      BRIEFINGS_ROOT,
      aiBriefingConfig.dedupeSectionHeading || DEFAULT_AI_BRIEFING_CONFIG.dedupeSectionHeading,
      aiBriefingConfig.dedupeLookbackIssues || DEFAULT_AI_BRIEFING_CONFIG.dedupeLookbackIssues,
      "AI 简报",
      genericAiHeadingSet,
    );
  }

  validateLinksAndImages(parsed.body, file, slugs);
}

/**
 * @param {string} body
 * @param {string} heading
 */
function findHeading(body, heading) {
  return body.match(new RegExp(`^##\\s+${heading}\\s*$`, "m"));
}

/**
 * @param {string} body
 * @param {string} heading
 */
function getSectionContent(body, heading) {
  const match = new RegExp(`^##\\s+${heading}\\s*$`, "m").exec(body);
  if (!match || match.index === undefined) {
    return "";
  }

  const start = match.index + match[0].length;
  const remainder = body.slice(start);
  const nextHeading = remainder.match(/^##\s+/m);
  const end = nextHeading && nextHeading.index !== undefined ? start + nextHeading.index : body.length;
  return body.slice(start, end).trim();
}

/**
 * @param {string} body
 * @param {string} heading
 */
function getSectionRange(body, heading) {
  const match = new RegExp(`^##\\s+${heading}\\s*$`, "m").exec(body);
  if (!match || match.index === undefined) {
    return null;
  }

  const start = match.index + match[0].length;
  const remainder = body.slice(start);
  const nextHeading = remainder.match(/^##\s+/m);
  const end = nextHeading && nextHeading.index !== undefined ? start + nextHeading.index : body.length;
  return {
    start,
    end,
    content: body.slice(start, end).trim(),
  };
}

/** @param {string} text */
function buildTrigramSet(text) {
  const normalized = normalizeComparableText(text);
  if (normalized.length <= 3) {
    return new Set(normalized ? [normalized] : []);
  }

  const trigrams = new Set();
  for (let index = 0; index <= normalized.length - 3; index += 1) {
    trigrams.add(normalized.slice(index, index + 3));
  }
  return trigrams;
}

/**
 * @param {string} left
 * @param {string} right
 */
function calculateDiceCoefficient(left, right) {
  const leftSet = buildTrigramSet(left);
  const rightSet = buildTrigramSet(right);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const item of leftSet) {
    if (rightSet.has(item)) {
      intersectionSize += 1;
    }
  }

  return (2 * intersectionSize) / (leftSet.size + rightSet.size);
}

/**
 * @param {string} body
 * @param {string} heading
 * @param {Set<string>} genericHeadingSet
 */
function extractDedupeEntries(body, heading, genericHeadingSet) {
  const sectionRange = getSectionRange(body, heading);
  if (!sectionRange || sectionRange.content.length === 0) {
    return [];
  }

  const headingMatches = Array.from(sectionRange.content.matchAll(/^###\s+(.+)$/gm));
  if (headingMatches.length === 0) {
    return [];
  }

  return headingMatches
    .map((match, index) => {
      const sectionIndex = match.index ?? 0;
      const nextIndex = headingMatches[index + 1]?.index ?? sectionRange.content.length;
      const headingLine = match[0];
      const entryHeading = match[1].trim();
      const entryBody = sectionRange.content.slice(sectionIndex + headingLine.length, nextIndex).trim();
      const normalizedHeading = normalizeComparableText(entryHeading);
      const summaryText = toPlainBriefingText(entryBody).slice(0, 220);
      const normalizedBody = normalizeComparableText(summaryText);
      const combinedText = normalizeComparableText(`${entryHeading} ${summaryText}`);

      return {
        heading: entryHeading,
        normalizedHeading,
        normalizedBody,
        combinedText,
        isGenericHeading: genericHeadingSet.has(normalizedHeading) || normalizedHeading.length <= 8,
        line: getLineNumber(body, sectionRange.start + sectionIndex),
      };
    })
    .filter((entry) => entry.normalizedHeading.length > 0 && entry.normalizedBody.length > 0);
}

/**
 * @param {{ heading: string; normalizedHeading: string; normalizedBody: string; combinedText: string; isGenericHeading: boolean }} currentEntry
 * @param {{ heading: string; normalizedHeading: string; normalizedBody: string; combinedText: string; isGenericHeading: boolean }} previousEntry
 */
function isLikelyDuplicateEntry(currentEntry, previousEntry) {
  const exactHeadingMatch = currentEntry.normalizedHeading === previousEntry.normalizedHeading;
  const bodySimilarity = calculateDiceCoefficient(currentEntry.normalizedBody, previousEntry.normalizedBody);
  const combinedSimilarity = calculateDiceCoefficient(currentEntry.combinedText, previousEntry.combinedText);
  const [shorterBody, longerBody] = currentEntry.normalizedBody.length <= previousEntry.normalizedBody.length
    ? [currentEntry.normalizedBody, previousEntry.normalizedBody]
    : [previousEntry.normalizedBody, currentEntry.normalizedBody];
  const containsShorterBody = shorterBody.length >= 24 && longerBody.includes(shorterBody);

  if (exactHeadingMatch) {
    const threshold = currentEntry.isGenericHeading || previousEntry.isGenericHeading ? 0.82 : 0.68;
    return bodySimilarity >= threshold || combinedSimilarity >= Math.max(0.84, threshold) || containsShorterBody;
  }

  return combinedSimilarity >= 0.93 && bodySimilarity >= 0.88;
}

/**
 * @param {string} file
 */
function readPublishedBriefingEntry(file) {
  let content;

  try {
    content = fs.readFileSync(file, "utf-8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }

  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return null;
  }

  const date = extractField(parsed.raw, "date");
  if (!date) {
    return null;
  }

  const publishedRaw = extractField(parsed.raw, "published");
  if (publishedRaw !== null && unquote(publishedRaw) !== "true") {
    return null;
  }

  return {
    file,
    date: unquote(date),
    body: parsed.body,
  };
}

/**
 * @param {ReturnType<typeof readPublishedBriefingEntry>} entry
 * @returns {entry is { file: string; date: string; body: string }}
 */
function isPublishedBriefingEntry(entry) {
  return entry !== null;
}

/**
 * @param {string} currentFile
 * @param {string} currentDate
 * @param {string} rootDir
 * @param {string} sectionHeading
 * @param {number} lookbackIssues
 * @param {string} label
 * @param {Set<string>} genericHeadingSet
 */
function validateRecentBriefingDuplicates(currentFile, currentDate, rootDir, sectionHeading, lookbackIssues, label, genericHeadingSet) {
  const configSource = label === "AI 简报" ? aiBriefingConfig : investmentBriefingConfig;
  const defaultConfig = label === "AI 简报" ? DEFAULT_AI_BRIEFING_CONFIG : DEFAULT_INVESTMENT_BRIEFING_CONFIG;
  const dedupeEffectiveFrom = configSource.dedupeEffectiveFrom || defaultConfig.dedupeEffectiveFrom;

  if (dedupeEffectiveFrom && currentDate < dedupeEffectiveFrom) {
    return;
  }

  const currentContent = fs.readFileSync(currentFile, "utf-8");
  const parsedCurrent = parseFrontmatter(currentContent);
  if (!parsedCurrent) {
    return;
  }

  const currentEntries = extractDedupeEntries(parsedCurrent.body, sectionHeading, genericHeadingSet);
  if (currentEntries.length === 0) {
    return;
  }

  const previousEntries = getMarkdownFiles(rootDir)
    .filter((file) => BRIEFING_EXT_RE.test(file) && path.resolve(file) !== path.resolve(currentFile))
    .map(readPublishedBriefingEntry)
    .filter(isPublishedBriefingEntry)
    .filter((entry) => entry.date < currentDate)
    .filter((entry) => !dedupeEffectiveFrom || entry.date >= dedupeEffectiveFrom)
    .sort((left, right) => (right.date > left.date ? 1 : right.date < left.date ? -1 : 0))
    .slice(0, lookbackIssues)
    .flatMap((entry) => extractDedupeEntries(entry.body, sectionHeading, genericHeadingSet).map((item) => ({
      ...item,
      file: entry.file,
    })));

  for (const currentEntry of currentEntries) {
    const matchedEntry = previousEntries.find((previousEntry) => isLikelyDuplicateEntry(currentEntry, previousEntry));
    if (!matchedEntry) {
      continue;
    }

    addError(
      `${label} 最近 ${lookbackIssues} 期存在疑似重复事件：\`${currentEntry.heading}\` 与 ${toPosixPath(path.relative(ROOT, matchedEntry.file))} 中的 \`${matchedEntry.heading}\` 高度重复；如确有新增增量，请在标题或正文中明确写出新的可核验变化点`,
      toPosixPath(path.relative(ROOT, currentFile)),
      currentEntry.line,
    );
    return;
  }
}

/**
 * @param {string} file
 * @param {Set<string>} slugs
 */
function validateInvestmentBriefingFile(file, slugs) {
  const relativeFile = toPosixPath(path.relative(ROOT, file));
  const content = fs.readFileSync(file, "utf-8");
  const parsed = parseFrontmatter(content);
  const fileName = path.basename(file);
  const genericInvestmentHeadingSet = new Set();

  if (!parsed) {
    addError("未找到 frontmatter（投资简报必须以 --- 开头并包含 frontmatter）", relativeFile, 1);
    return;
  }

  if (!BRIEFING_EXT_RE.test(file)) {
    addError("投资简报必须使用 .md 文件", relativeFile, 1);
  }

  if (!/^\d{4}-\d{2}-\d{2}-investment-briefing\.md$/i.test(fileName)) {
    addError(`投资简报文件名必须匹配 YYYY-MM-DD-investment-briefing.md（当前：${fileName}）`, relativeFile, 1);
  }

  const title = extractField(parsed.raw, "title");
  if (!title || unquote(title) === "" || title === "null") {
    addError("frontmatter 缺少 title 或 title 为空", relativeFile, 1);
  }

  const date = extractField(parsed.raw, "date");
  let dateClean = "";
  if (!date) {
    addError("frontmatter 缺少 date", relativeFile, 1);
  } else {
    dateClean = unquote(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateClean)) {
      addError(`date 格式不合法（应为 YYYY-MM-DD，当前：${dateClean}）`, relativeFile, 1);
    } else if (Number.isNaN(new Date(dateClean).getTime())) {
      addError(`date 不是合法日期：${dateClean}`, relativeFile, 1);
    } else if (fileName !== `${dateClean}-investment-briefing.md`) {
      addError(`文件名日期必须与 frontmatter date 一致（当前文件名：${fileName}，date：${dateClean}）`, relativeFile, 1);
    }
  }

  const tags = extractArrayField(parsed.raw, "tags");
  if (!tags || tags.length === 0) {
    addError("frontmatter 缺少 tags 或 tags 为空数组", relativeFile, 1);
  } else {
    if (tags.length < 3) {
      addError("投资简报 tags 至少应包含 3 个标签", relativeFile, 1);
    }
  }

  const publishedRaw = extractField(parsed.raw, "published");
  if (publishedRaw === null) {
    addError("投资简报必须显式设置 published: true", relativeFile, 1);
  } else if (unquote(publishedRaw) !== "true") {
    addError(`投资简报 published 必须为 true（当前：${publishedRaw}）`, relativeFile, 1);
  }

  const brief = extractBrief(parsed.raw);
  if (!brief) {
    addError("frontmatter 缺少 brief 或 brief 为空", relativeFile, 1);
  }

  const sourceSectionHeading = investmentBriefingConfig.sourceSectionHeading || DEFAULT_INVESTMENT_BRIEFING_CONFIG.sourceSectionHeading;
  const chineseCharacters = countChineseCharacters(removeSections(parsed.body, [sourceSectionHeading]));
  const investmentBodyRange = normalizeInvestmentBodyLengthRule(resolveInvestmentBodyLengthRule(dateClean));

  if (chineseCharacters < investmentBodyRange.shortMin || chineseCharacters > investmentBodyRange.normalMax) {
    addError(
      `投资简报正文汉字数（不含来源章节）应为 ${investmentBodyRange.shortMin}~${investmentBodyRange.normalMax}（当前：${chineseCharacters}）`,
      relativeFile,
      1,
    );
  }

  const confirmSectionHeading = investmentBriefingConfig.confirmSectionHeading || DEFAULT_INVESTMENT_BRIEFING_CONFIG.confirmSectionHeading;
  const watchSectionHeading = investmentBriefingConfig.watchSectionHeading || DEFAULT_INVESTMENT_BRIEFING_CONFIG.watchSectionHeading;
  const confirmMatch = findHeading(parsed.body, confirmSectionHeading);
  const watchMatch = findHeading(parsed.body, watchSectionHeading);
  const sourcesMatch = findHeading(parsed.body, sourceSectionHeading);
  const expectationMatch = findHeading(parsed.body, "预期观察");

  if (!confirmMatch) {
    addError(`投资简报缺少 \`## ${confirmSectionHeading}\` 章节`, relativeFile, 1);
  }
  if (!watchMatch) {
    addError(`投资简报缺少 \`## ${watchSectionHeading}\` 章节`, relativeFile, 1);
  }
  if (!sourcesMatch) {
    addError(`投资简报缺少 \`## ${sourceSectionHeading}\` 章节`, relativeFile, 1);
  }

  const bodyIndex = (match) => match?.index ?? -1;
  if (confirmMatch && watchMatch && bodyIndex(confirmMatch) > bodyIndex(watchMatch)) {
    addError(`\`## ${confirmSectionHeading}\` 必须出现在 \`## ${watchSectionHeading}\` 之前`, relativeFile, 1);
  }
  if (watchMatch && sourcesMatch && bodyIndex(watchMatch) > bodyIndex(sourcesMatch)) {
    addError(`\`## ${watchSectionHeading}\` 必须出现在 \`## ${sourceSectionHeading}\` 之前`, relativeFile, 1);
  }

  if (findHeading(parsed.body, "传闻观察")) {
    addError("已发布投资简报不允许包含 `## 传闻观察` 章节", relativeFile, 1);
  }

  if (/传闻/.test(parsed.body)) {
    addError("已发布投资简报不允许出现传闻相关表述", relativeFile, 1);
  }

  if (expectationMatch) {
    const expectationContent = getSectionContent(parsed.body, "预期观察");
    if (!/(预期[:：]|市场预期|一致预期)/.test(expectationContent)) {
      addError("存在 `## 预期观察` 章节时，正文必须显式标注为预期", relativeFile, 1);
    }
  }

  const sourcesContent = getSectionContent(parsed.body, sourceSectionHeading);
  if (sourcesContent.length === 0 || !/https?:\/\//.test(sourcesContent)) {
    addError("投资简报的 `## 来源` 章节必须包含至少一个可追溯来源链接", relativeFile, 1);
  }

  const disclaimer = investmentBriefingConfig.disclaimer || DEFAULT_INVESTMENT_BRIEFING_CONFIG.disclaimer;
  if (!parsed.body.includes(disclaimer)) {
    addError("投资简报缺少固定免责声明", relativeFile, 1);
  }

  const redline = parsed.body.match(INVESTMENT_REDLINE_RE);
  if (redline) {
    addError(`投资简报命中红线表达：${redline[0]}`, relativeFile, getLineNumber(parsed.body, redline.index ?? 0));
  }

  for (const pattern of INVESTMENT_PROCESS_LEAK_PATTERNS) {
    const leakedProcess = parsed.body.match(pattern);
    if (leakedProcess) {
      addError(
        `投资简报包含生成前思考/取舍说明，不得进入公开正文：${leakedProcess[0]}`,
        relativeFile,
        getLineNumber(parsed.body, leakedProcess.index ?? 0),
      );
      break;
    }
  }

  const blockedCompany = detectBlockedInvestmentCompany(parsed.body);
  if (blockedCompany) {
    addError(`投资简报包含黑名单企业相关内容：${blockedCompany}`, relativeFile, 1);
  }

  for (const mismatch of findInvestmentWeekdayMismatches(parsed.body)) {
    addError(
      `投资简报日期与星期不一致：${mismatch.text}（应为 ${mismatch.expectedWeekday}）`,
      relativeFile,
      mismatch.line,
    );
  }

  if (dateClean) {
    validateRecentBriefingDuplicates(
      file,
      dateClean,
      INVESTMENT_BRIEFINGS_ROOT,
      confirmSectionHeading,
      investmentBriefingConfig.dedupeLookbackIssues || DEFAULT_INVESTMENT_BRIEFING_CONFIG.dedupeLookbackIssues,
      "投资简报",
      genericInvestmentHeadingSet,
    );
  }

  validateLinksAndImages(parsed.body, file, slugs);
}

const blogFiles = getMarkdownFiles(CONTENT_ROOT);
const briefingFiles = getMarkdownFiles(BRIEFINGS_ROOT).filter((file) => BRIEFING_EXT_RE.test(file));
const investmentBriefingFiles = getMarkdownFiles(INVESTMENT_BRIEFINGS_ROOT).filter((file) => BRIEFING_EXT_RE.test(file));
const allFiles = [...blogFiles, ...briefingFiles, ...investmentBriefingFiles];
const slugUsage = collectSlugUsage(allFiles);
const slugSet = new Set(slugUsage.keys());

if (targetPath) {
  const absolutePath = validateContentPath(targetPath);
  const relativeTarget = toPosixPath(path.relative(ROOT, absolutePath));
  const targetSlug = path.basename(targetPath).replace(MARKDOWN_EXT_RE, "");
  const conflicts = (slugUsage.get(targetSlug) ?? []).filter((file) => file !== relativeTarget);

  if (checkPathOnly && fs.existsSync(absolutePath)) {
    addError(`文件已存在：${targetPath}`, targetPath);
  }

  if (conflicts.length > 0) {
    addError(`Slug 冲突：slug "${targetSlug}" 已被 ${conflicts.join(", ")} 使用`, targetPath);
  }

  if (!checkPathOnly) {
    if (!fs.existsSync(absolutePath)) {
      addError(`文件不存在，无法校验：${targetPath}`, targetPath);
    } else {
      if (relativeTarget.startsWith("content/ai-briefings/")) {
        validateBriefingFile(absolutePath, slugSet);
      } else if (relativeTarget.startsWith("content/investment-briefings/")) {
        validateInvestmentBriefingFile(absolutePath, slugSet);
      } else {
        validatePostFile(absolutePath, slugSet);
      }
    }
  }
} else {
  console.log(`\n📋 校验 content/blog 下 ${blogFiles.length} 篇文章，content/ai-briefings 下 ${briefingFiles.length} 篇简报，content/investment-briefings 下 ${investmentBriefingFiles.length} 篇简报\n`);
  for (const [slug, paths] of slugUsage.entries()) {
    if (paths.length > 1) {
      addError(`Slug 冲突：slug "${slug}" 被多个文件使用：${paths.join(", ")}`);
    }
  }

  for (const file of blogFiles) {
    validatePostFile(file, slugSet);
  }

  for (const file of briefingFiles) {
    validateBriefingFile(file, slugSet);
  }

  for (const file of investmentBriefingFiles) {
    validateInvestmentBriefingFile(file, slugSet);
  }
}

if (errors.length > 0) {
  console.error("❌ 内容校验失败：");
  for (const error of errors) {
    const location = error.file ? `${error.file}${error.line ? `:${error.line}` : ""}` : "全局";
    console.error(`  - ${location} ${error.message}`);
  }
  process.exit(1);
}

console.log("✅ 内容校验通过。");
process.exit(0);
