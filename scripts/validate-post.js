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

const ROOT = path.resolve(__dirname, "..");
const CONTENT_ROOT = path.join(ROOT, "content/blog");
const BRIEFINGS_ROOT = path.join(ROOT, "content/ai-briefings");
const INVESTMENT_BRIEFINGS_ROOT = path.join(ROOT, "content/investment-briefings");
const INVESTMENT_CONFIG_ROOT = path.join(ROOT, "config/investment");
const MARKDOWN_EXT_RE = /\.mdx?$/i;
const BRIEFING_EXT_RE = /\.md$/i;
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
let investmentBlockedCompanies = [];

try {
  const blockedCompaniesPath = path.join(INVESTMENT_CONFIG_ROOT, "blocked-companies.json");
  if (fs.existsSync(blockedCompaniesPath)) {
    investmentBlockedCompanies = JSON.parse(fs.readFileSync(blockedCompaniesPath, "utf8"));
  }
} catch (error) {
  console.warn("[validate-post] Failed to load investment blocked companies:", error);
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
    addError(`AI 每日简报文件扩展名必须是 .md（当前：${path.extname(filePath) || "无扩展名"}）`, filePath);
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
    return path.join(ROOT, "public", cleanHref);
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

  if (!parsed) {
    addError("未找到 frontmatter（简报必须以 --- 开头并包含 frontmatter）", relativeFile, 1);
    return;
  }

  if (!BRIEFING_EXT_RE.test(file)) {
    addError("AI 每日简报必须使用 .md 文件", relativeFile, 1);
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
  }

  const publishedRaw = extractField(parsed.raw, "published");
  if (publishedRaw === null) {
    addError("AI 每日简报必须显式设置 published: true", relativeFile, 1);
  } else if (unquote(publishedRaw) !== "true") {
    addError(`AI 每日简报 published 必须为 true（当前：${publishedRaw}）`, relativeFile, 1);
  }

  const brief = extractBrief(parsed.raw);
  if (!brief) {
    addError("frontmatter 缺少 brief 或 brief 为空", relativeFile, 1);
  }

  const chineseCharacters = countChineseCharacters(removeSections(parsed.body, ["来源"]));
  if (chineseCharacters < 700 || chineseCharacters > 1100) {
    addError(`AI 每日简报正文汉字数（不含来源章节）应为 700~1100（当前：${chineseCharacters}）`, relativeFile, 1);
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
 * @param {string} file
 * @param {Set<string>} slugs
 */
function validateInvestmentBriefingFile(file, slugs) {
  const relativeFile = toPosixPath(path.relative(ROOT, file));
  const content = fs.readFileSync(file, "utf-8");
  const parsed = parseFrontmatter(content);
  const fileName = path.basename(file);

  if (!parsed) {
    addError("未找到 frontmatter（投资简报必须以 --- 开头并包含 frontmatter）", relativeFile, 1);
    return;
  }

  if (!BRIEFING_EXT_RE.test(file)) {
    addError("投资每日简报必须使用 .md 文件", relativeFile, 1);
  }

  if (!/^\d{4}-\d{2}-\d{2}-investment-daily-briefing\.md$/i.test(fileName)) {
    addError(`投资每日简报文件名必须匹配 YYYY-MM-DD-investment-daily-briefing.md（当前：${fileName}）`, relativeFile, 1);
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
    } else if (fileName !== `${dateClean}-investment-daily-briefing.md`) {
      addError(`文件名日期必须与 frontmatter date 一致（当前文件名：${fileName}，date：${dateClean}）`, relativeFile, 1);
    }
  }

  const tags = extractArrayField(parsed.raw, "tags");
  if (!tags || tags.length === 0) {
    addError("frontmatter 缺少 tags 或 tags 为空数组", relativeFile, 1);
  } else {
    if (!tags.includes("投资每日简报")) {
      addError("投资每日简报 tags 必须包含 `投资每日简报`", relativeFile, 1);
    }
    if (tags.length < 3) {
      addError("投资每日简报 tags 至少应包含 3 个标签（含 `投资每日简报`）", relativeFile, 1);
    }
    if (tags.length === 1 && tags[0] === "投资每日简报") {
      addError("投资每日简报 tags 不能只有 `投资每日简报` 一个标签", relativeFile, 1);
    }
  }

  const publishedRaw = extractField(parsed.raw, "published");
  if (publishedRaw === null) {
    addError("投资每日简报必须显式设置 published: true", relativeFile, 1);
  } else if (unquote(publishedRaw) !== "true") {
    addError(`投资每日简报 published 必须为 true（当前：${publishedRaw}）`, relativeFile, 1);
  }

  const brief = extractBrief(parsed.raw);
  if (!brief) {
    addError("frontmatter 缺少 brief 或 brief 为空", relativeFile, 1);
  }

  const chineseCharacters = countChineseCharacters(removeSections(parsed.body, ["来源"]));
  if (chineseCharacters < 900 || chineseCharacters > 1500) {
    addError(`投资每日简报正文汉字数（不含来源章节）应为 900~1500（当前：${chineseCharacters}）`, relativeFile, 1);
  }

  const confirmMatch = findHeading(parsed.body, "近 24 小时确认动态");
  const watchMatch = findHeading(parsed.body, "未来重点观察");
  const sourcesMatch = findHeading(parsed.body, "来源");
  const expectationMatch = findHeading(parsed.body, "预期观察");

  if (!confirmMatch) {
    addError("投资每日简报缺少 `## 近 24 小时确认动态` 章节", relativeFile, 1);
  }
  if (!watchMatch) {
    addError("投资每日简报缺少 `## 未来重点观察` 章节", relativeFile, 1);
  }
  if (!sourcesMatch) {
    addError("投资每日简报缺少 `## 来源` 章节", relativeFile, 1);
  }

  const bodyIndex = (match) => match?.index ?? -1;
  if (confirmMatch && watchMatch && bodyIndex(confirmMatch) > bodyIndex(watchMatch)) {
    addError("`## 近 24 小时确认动态` 必须出现在 `## 未来重点观察` 之前", relativeFile, 1);
  }
  if (watchMatch && sourcesMatch && bodyIndex(watchMatch) > bodyIndex(sourcesMatch)) {
    addError("`## 未来重点观察` 必须出现在 `## 来源` 之前", relativeFile, 1);
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

  const sourcesContent = getSectionContent(parsed.body, "来源");
  if (sourcesContent.length === 0 || !/https?:\/\//.test(sourcesContent)) {
    addError("投资每日简报的 `## 来源` 章节必须包含至少一个可追溯来源链接", relativeFile, 1);
  }

  const disclaimer = "**郑重声明：本文仅为公开信息整理与观察记录，不构成任何投资建议或个股推荐。**";
  if (!parsed.body.includes(disclaimer)) {
    addError("投资每日简报缺少固定免责声明", relativeFile, 1);
  }

  const redline = parsed.body.match(INVESTMENT_REDLINE_RE);
  if (redline) {
    addError(`投资每日简报命中红线表达：${redline[0]}`, relativeFile, getLineNumber(parsed.body, redline.index ?? 0));
  }

  for (const pattern of INVESTMENT_PROCESS_LEAK_PATTERNS) {
    const leakedProcess = parsed.body.match(pattern);
    if (leakedProcess) {
      addError(
        `投资每日简报包含生成前思考/取舍说明，不得进入公开正文：${leakedProcess[0]}`,
        relativeFile,
        getLineNumber(parsed.body, leakedProcess.index ?? 0),
      );
      break;
    }
  }

  const blockedCompany = detectBlockedInvestmentCompany(parsed.body);
  if (blockedCompany) {
    addError(`投资每日简报包含黑名单企业相关内容：${blockedCompany}`, relativeFile, 1);
  }

  for (const mismatch of findInvestmentWeekdayMismatches(parsed.body)) {
    addError(
      `投资每日简报日期与星期不一致：${mismatch.text}（应为 ${mismatch.expectedWeekday}）`,
      relativeFile,
      mismatch.line,
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
