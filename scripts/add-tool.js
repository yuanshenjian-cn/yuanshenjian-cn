#!/usr/bin/env node

// @ts-check

/**
 * add-tool.js
 *
 * 用法：
 *   node scripts/add-tool.js /path/to/tool.html --slug pomodoro --title "番茄钟" \
 *     --description "一次只做一件事" [--emoji 🍅] [--tags 效率,专注] [--force]
 *
 *   just add-tool /path/to/tool.html pomodoro "番茄钟" "一次只做一件事"
 *
 * 做什么：
 *   1. 把 HTML 复制到 site/public/tools/<slug>/view.html（构建后由 GH Pages 静态托管）
 *   2. 在 site/data/tools.json 中新增或更新一条登记记录
 *
 * 注意：文件名必须是 view.html。详情页路由 `/tools/<slug>` 在静态导出时
 * 会占用 `dist/tools/<slug>/index.html`，放 index.html 会互相覆盖。
 *
 * 小工具统一约定：一个工具 = 一个目录 + 一条注册记录，无需改动任何 TSX 代码。
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const TOOLS_DIR = path.join(REPO_ROOT, "site", "public", "tools");
const REGISTRY_FILE = path.join(REPO_ROOT, "site", "data", "tools.json");
const DEFAULT_EMOJI = "🧩";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {{ positionals: string[], flags: Record<string, string | boolean> }} */
  const result = { positionals: [], flags: {} };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      result.positionals.push(arg);
      continue;
    }

    const key = arg.slice(2);
    if (key === "force" || key === "no-copy") {
      result.flags[key] = true;
      continue;
    }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      fail(`参数 --${key} 缺少取值`);
    }
    result.flags[key] = value;
    i += 1;
  }

  return result;
}

/** 输出帮助信息 */
function printUsage() {
  console.log(
    [
      "用法：node scripts/add-tool.js <html 路径> --slug <slug> --title <标题> --description <说明>",
      "",
      "可选参数：",
      "  --emoji <符号>    卡片展示符号，默认 🧩",
      "  --tags <标签>     逗号分隔，如 效率,专注",
      "  --force           覆盖已存在的同名工具",
      "  --no-copy         只登记，不复制 HTML（HTML 已手动放好时使用）",
    ].join("\n"),
  );
}

/** @param {string} file */
function readRegistry(file) {
  if (!fs.existsSync(file)) {
    return { tools: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return { tools: Array.isArray(parsed.tools) ? parsed.tools : [] };
  } catch (error) {
    fail(`无法解析 ${path.relative(REPO_ROOT, file)}：${error instanceof Error ? error.message : error}`);
  }
}

/** @param {string} date */
function formatDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const sourceHtml = positionals[0];

  if (!sourceHtml) {
    printUsage();
    process.exit(1);
  }

  const slug = typeof flags.slug === "string" ? flags.slug.trim() : "";
  const title = typeof flags.title === "string" ? flags.title.trim() : "";
  const description = typeof flags.description === "string" ? flags.description.trim() : "";

  if (!SLUG_PATTERN.test(slug)) {
    fail("缺少合法的 --slug（只允许小写字母、数字和中划线，如 pomodoro）");
  }
  if (!title) {
    fail("缺少 --title");
  }
  if (!description) {
    fail("缺少 --description");
  }

  const sourcePath = path.resolve(process.cwd(), sourceHtml);
  const shouldCopy = !flags["no-copy"];

  if (shouldCopy && !fs.existsSync(sourcePath)) {
    fail(`找不到 HTML 文件：${sourcePath}`);
  }

  const targetDir = path.join(TOOLS_DIR, slug);
  const targetFile = path.join(targetDir, "view.html");
  const conflictFile = path.join(targetDir, "index.html");
  const alreadyExists = fs.existsSync(targetFile);

  if (fs.existsSync(conflictFile)) {
    fail(
      `检测到 ${path.relative(REPO_ROOT, conflictFile)} 与详情页路由冲突，` +
        "请改名或删除后重试（工具入口只认 view.html）",
    );
  }

  if (alreadyExists && !flags.force) {
    fail(`工具 "${slug}" 已存在（${path.relative(REPO_ROOT, targetFile)}），如需覆盖请加 --force`);
  }

  if (shouldCopy) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(sourcePath, targetFile);
  }

  const registry = readRegistry(REGISTRY_FILE);
  const tags = typeof flags.tags === "string"
    ? flags.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    : [];

  const index = registry.tools.findIndex((tool) => tool && tool.slug === slug);
  const previous = index >= 0 ? registry.tools[index] : null;

  /** @type {Record<string, unknown>} */
  const entry = {
    slug,
    title,
    description,
    emoji: typeof flags.emoji === "string" && flags.emoji.trim() ? flags.emoji.trim() : previous?.emoji || DEFAULT_EMOJI,
    tags: tags.length > 0 ? tags : previous?.tags || [],
    addedAt: previous?.addedAt || formatDate(new Date()),
  };

  if (previous?.featured) {
    entry.featured = true;
  }

  if (index >= 0) {
    registry.tools[index] = entry;
  } else {
    registry.tools.push(entry);
  }

  fs.mkdirSync(path.dirname(REGISTRY_FILE), { recursive: true });
  fs.writeFileSync(REGISTRY_FILE, `${JSON.stringify({ tools: registry.tools }, null, 2)}\n`, "utf8");

  console.log(`✔ 小工具已登记：${title}（${slug}）`);
  if (shouldCopy) {
    console.log(`  HTML → ${path.relative(REPO_ROOT, targetFile)}`);
  }
  console.log(`  注册表 → ${path.relative(REPO_ROOT, REGISTRY_FILE)}`);
  console.log(`  访问路径 → /tools/${slug}`);
}

main();
