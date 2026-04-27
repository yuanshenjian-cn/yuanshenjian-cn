#!/usr/bin/env node

// @ts-check

/**
 * validate-post.js
 *
 * 用法：
 *   npm run validate-content
 *     校验 content/blog 下所有 .md/.mdx 内容。
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
const MARKDOWN_EXT_RE = /\.mdx?$/i;
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
  const relativeToContentRoot = path.relative(CONTENT_ROOT, absolutePath);

  if (!MARKDOWN_EXT_RE.test(filePath)) {
    addError(`文件扩展名必须是 .md 或 .mdx（当前：${path.extname(filePath) || "无扩展名"}）`, filePath);
  }

  if (!normalizedTarget.startsWith("content/blog/") && !normalizedTarget.startsWith("./content/blog/")) {
    addError(`路径必须位于 content/blog/ 下（当前：${filePath}）`, filePath);
  }

  if (relativeToContentRoot.startsWith("..") || path.isAbsolute(relativeToContentRoot)) {
    addError(`解析后的路径不在 content/blog/ 下（当前：${filePath}）`, filePath);
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

const allFiles = getMarkdownFiles(CONTENT_ROOT);
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
      validatePostFile(absolutePath, slugSet);
    }
  }
} else {
  console.log(`\n📋 校验 content/blog 下 ${allFiles.length} 篇文章\n`);
  for (const [slug, paths] of slugUsage.entries()) {
    if (paths.length > 1) {
      addError(`Slug 冲突：slug "${slug}" 被多个文件使用：${paths.join(", ")}`);
    }
  }

  for (const file of allFiles) {
    validatePostFile(file, slugSet);
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
