#!/usr/bin/env node

// @ts-check

/**
 * validate-post.js
 *
 * 用法：
 *   npm run validate-post -- --check-path "content/blog/swd/ai-coding/ai-frontier/foo.md"
 *     仅校验路径合法性（不检查 frontmatter）
 *
 *   npm run validate-post -- "content/blog/swd/ai-coding/ai-frontier/foo.md"
 *     校验路径 + 校验 frontmatter（文件必须存在）
 *
 *   npm run validate-post -- --strict-writing "content/blog/swd/ai-coding/ai-frontier/foo.md"
 *     在完整校验基础上，额外检查新文章写作规范
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ──────────────────────────────────────────────
// 参数解析
// ──────────────────────────────────────────────
/** @type {string[]} */
const args = process.argv.slice(2);
let checkPathOnly = false;
let strictWriting = false;
/** @type {string | null} */
let targetPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--check-path') {
    checkPathOnly = true;
    targetPath = args[i + 1];
    i++;
  } else if (args[i] === '--strict-writing') {
    strictWriting = true;
  } else if (!args[i].startsWith('-')) {
    targetPath = args[i];
  }
}

if (!targetPath) {
  console.error('❌ 用法：');
  console.error('  npm run validate-post -- --check-path "content/blog/.../foo.md"');
  console.error('  npm run validate-post -- "content/blog/.../foo.md"');
  console.error('  npm run validate-post -- --strict-writing "content/blog/.../foo.md"');
  process.exit(1);
}

// ──────────────────────────────────────────────
// 工具函数
// ──────────────────────────────────────────────

/** 收集 content/blog 下所有已存在文章的 slug（basename 不含扩展名） */
/**
 * @param {string} contentRoot
 * @returns {Map<string, string>}
 */
function collectExistingSlugs(contentRoot) {
  const slugs = new Map(); // slug -> relativePath
  /** @param {string} dir */
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const slug = entry.name.replace(/\.md$/, '');
        const rel = path.relative(ROOT, full);
        slugs.set(slug, rel);
      }
    }
  }
  walk(contentRoot);
  return slugs;
}

/** 简单解析 frontmatter（不依赖 gray-matter，避免依赖问题） */
/** @param {string} content */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return match[1];
}

/** @param {string} content */
function stripFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

/** @param {string} content */
function stripFencedCodeBlocks(content) {
  return content.replace(/```[\s\S]*?```/g, '');
}

/** 从 YAML 文本中提取字段（仅支持基础类型和字符串数组） */
/**
 * @param {string} yaml
 * @param {string} key
 */
function extractField(yaml, key) {
  // 匹配 key: value（单行字符串或布尔值）
  const singleLine = new RegExp(`^${key}:\\s*(.+)$`, 'm');
  const m = yaml.match(singleLine);
  if (m) return m[1].trim();
  return null;
}

/** 提取字符串数组字段，支持两种格式：
 *  多行：tags:\n  - foo\n  - bar
 *  单行：tags: ['foo', 'bar'] 或 tags: ["foo", "bar"]
 */
/**
 * @param {string} yaml
 * @param {string} key
 * @returns {string[] | null}
 */
function extractArrayField(yaml, key) {
  // 先尝试单行数组格式：tags: ['a', 'b'] 或 tags: ["a", "b"]
  const singleLine = new RegExp(`^${key}:\\s*\\[(.+)\\]`, 'm');
  const sm = yaml.match(singleLine);
  if (sm) {
    // 解析逗号分隔的引号字符串
    return sm[1].match(/['"]([^'"]+)['"]/g)?.map((s) => s.replace(/^['"]|['"]$/g, '')) ?? [];
  }
  // 多行 YAML 列表格式
  const block = new RegExp(`^${key}:[^\\S\\r\\n]*\\r?\\n((?:[^\\S\\r\\n]*-[^\\r\\n]*\\r?\\n?)+)`, 'm');
  const m = yaml.match(block);
  if (!m) return null;
  return m[1].trim().split(/\r?\n/).map((l) => l.replace(/^[^\S\r\n]*-[^\S\r\n]*/, '').trim());
}

/** 提取 brief（支持 >- 折叠式、单行引号式和普通单行） */
/** @param {string} yaml */
function extractBrief(yaml) {
  // 折叠式：brief: >-\n  内容（可能是紧跟的单行，也可能是多行）
  const fold = yaml.match(/^brief:\s*[>|][-+]?\s*\r?\n((?:[^\S\r\n]+[^\r\n]*\r?\n?)+)/m);
  if (fold) return fold[1].replace(/\s+/g, ' ').trim();
  // 单行带引号：brief: "xxx" 或 brief: 'xxx'
  const quoted = yaml.match(/^brief:\s*["'](.+?)["']\s*$/m);
  if (quoted) return quoted[1].trim();
  // 普通单行：brief: xxx（不带引号，不以 > 开头）
  const plain = yaml.match(/^brief:\s*([^>|'"\r\n].+?)\s*$/m);
  if (plain) return plain[1].trim();
  return null;
}

let hasError = false;

function error(msg) {
  console.error(`❌ ${msg}`);
  hasError = true;
}

function ok(msg) {
  console.log(`✅ ${msg}`);
}

/**
 * @param {string} body
 */
function validateWritingRules(body) {
  const prose = stripFencedCodeBlocks(body);
  const forbiddenPhrases = [
    '总的来说',
    '综上所述',
    '值得一提的是',
    '值得注意的是',
    '深入探讨',
    '全面分析',
    '深度解析',
    '至关重要',
    '尤为重要',
    '不可或缺',
    '不难发现',
    '由此可见',
    '可以说',
    '可谓',
    '毋庸置疑',
    '本文将',
    '接下来我们将',
    '多维度分析',
    '重新定义',
    '颠覆式',
    '划时代',
  ];

  if (/^#\s+/m.test(prose)) {
    error('正文不能出现一级标题 "# "，文章标题只放在 frontmatter.title');
  }

  if (/^\s*---\s*$/m.test(prose)) {
    error('正文不能使用独立的 "---" 章节分割线');
  }

  const hasMdxSyntax =
    /\bclassName\s*=/.test(prose) ||
    /^import\s.+from\s+['"].+['"];?$/m.test(prose) ||
    /^export\s+/m.test(prose) ||
    /<[A-Z][A-Za-z0-9]*(\s|>|\/>)/.test(prose);

  if (hasMdxSyntax) {
    error('正文疑似包含 MDX/JSX 语法；博客文章只能使用普通 Markdown');
  }

  for (const phrase of forbiddenPhrases) {
    if (prose.includes(phrase)) {
      error(`正文包含禁用短语："${phrase}"`);
    }
  }
}

// ──────────────────────────────────────────────
// 路径校验（--check-path 和完整校验都执行）
// ──────────────────────────────────────────────

console.log(`\n📋 校验目标：${targetPath}\n`);

// 1. 扩展名必须是 .md
if (!targetPath.endsWith('.md')) {
  error(`文件扩展名不是 .md（当前：${path.extname(targetPath) || '无扩展名'}）`);
}

// 2. 必须位于 content/blog/ 下
const normalizedTarget = targetPath.replace(/\\/g, '/');
if (!normalizedTarget.startsWith('content/blog/') && !normalizedTarget.startsWith('./content/blog/')) {
  error(`路径必须位于 content/blog/ 下（当前：${targetPath}）`);
}

const absolutePath = path.resolve(ROOT, targetPath);
const contentBlogRoot = path.join(ROOT, 'content/blog');
const relativeToContentRoot = path.relative(contentBlogRoot, absolutePath);
if (relativeToContentRoot.startsWith('..') || path.isAbsolute(relativeToContentRoot)) {
  error(`解析后的路径不在 content/blog/ 下（当前：${targetPath}）`);
}

// 3. 目标目录是否存在
const targetDir = path.dirname(absolutePath);
if (!fs.existsSync(targetDir)) {
  error(`目标目录不存在：${path.relative(ROOT, targetDir)}`);
} else {
  ok(`目标目录存在：${path.relative(ROOT, targetDir)}`);
}

// 4. 文件是否已存在（check-path 模式下：已存在则警告）
const fileExists = fs.existsSync(absolutePath);
if (checkPathOnly) {
  if (fileExists) {
    error(`文件已存在：${targetPath}`);
  } else {
    ok(`文件路径可用（尚未存在）：${targetPath}`);
  }
}

// 5. Slug 唯一性检查
if (fs.existsSync(contentBlogRoot)) {
  const slug = path.basename(targetPath, '.md');
  const existingSlugs = collectExistingSlugs(contentBlogRoot);

  if (existingSlugs.has(slug)) {
    const conflictPath = existingSlugs.get(slug);
    if (path.resolve(ROOT, conflictPath) !== absolutePath) {
      error(`Slug 冲突：slug "${slug}" 已被 ${conflictPath} 使用`);
    } else {
      // 同一文件，校验模式下只是文件已存在
      ok(`Slug "${slug}" 唯一（指向同一文件）`);
    }
  } else {
    ok(`Slug "${slug}" 唯一，无冲突`);
  }
}

// ──────────────────────────────────────────────
// Frontmatter 校验（非 --check-path 模式）
// ──────────────────────────────────────────────

if (!checkPathOnly) {
  if (!fileExists) {
    error(`文件不存在，无法校验 frontmatter：${targetPath}`);
    console.log('\n提示：校验已存在文件的 frontmatter 时，不要使用 --check-path 参数。');
    process.exit(1);
  }

  console.log('\n--- Frontmatter 校验 ---\n');

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const fmRaw = parseFrontmatter(content);

  if (!fmRaw) {
    error('未找到 frontmatter（文章必须以 --- 开头并包含 frontmatter）');
    process.exit(1);
  }

  // title：必填，非空字符串
  const title = extractField(fmRaw, 'title');
  if (!title || title === 'null') {
    error('frontmatter 缺少 title 或 title 为空');
  } else {
    ok(`title: ${title.replace(/^['"]|['"]$/g, '')}`);
  }

  // date：必填，格式 YYYY-MM-DD
  const date = extractField(fmRaw, 'date');
  if (!date) {
    error('frontmatter 缺少 date');
  } else {
    const dateClean = date.replace(/^['"]|['"]$/g, '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateClean)) {
      error(`date 格式不合法（应为 YYYY-MM-DD，当前：${dateClean}）`);
    } else {
      const d = new Date(dateClean);
      if (isNaN(d.getTime())) {
        error(`date 不是合法日期：${dateClean}`);
      } else {
        ok(`date: ${dateClean}`);
      }
    }
  }

  // tags：必填，字符串数组，至少一项
  const tags = extractArrayField(fmRaw, 'tags');
  if (!tags || tags.length === 0) {
    error('frontmatter 缺少 tags 或 tags 为空数组');
  } else if (tags.some(t => typeof t !== 'string' || t.trim() === '')) {
    error('tags 中存在空字符串项');
  } else {
    ok(`tags: [${tags.join(', ')}]`);
  }

  // brief：必填，字符串
  const brief = extractBrief(fmRaw);
  if (!brief) {
    error('frontmatter 缺少 brief 或 brief 为空');
  } else {
    ok(`brief: ${brief.substring(0, 50)}${brief.length > 50 ? '...' : ''}`);
  }

  // published：必填，必须是布尔值。缺省会被博客运行时当作已发布。
  const publishedRaw = extractField(fmRaw, 'published');
  if (publishedRaw !== null) {
    if (publishedRaw !== 'true' && publishedRaw !== 'false') {
      error(`published 必须是布尔值（true 或 false），当前：${publishedRaw}`);
    } else {
      ok(`published: ${publishedRaw}`);
    }
  } else {
    error('frontmatter 缺少 published；草稿必须显式设置 published: false');
  }

  if (strictWriting) {
    console.log('\n--- 写作规范校验 ---\n');
    validateWritingRules(stripFrontmatter(content));
    if (!hasError) {
      ok('写作规范通过');
    }
  }
}

// ──────────────────────────────────────────────
// 结果汇总
// ──────────────────────────────────────────────

console.log('');
if (hasError) {
  console.error('─────────────────────────────────────');
  console.error('校验失败，请修复上述问题后重试。');
  process.exit(1);
} else {
  console.log('─────────────────────────────────────');
  console.log('校验通过。');
  process.exit(0);
}
