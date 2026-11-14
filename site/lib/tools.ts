import fs from "fs";
import path from "path";

import registry from "@/data/tools.json";
import type { ToolMeta } from "@/types/tool";

/**
 * 小工具注册表读取层。
 *
 * 约定：每个小工具是一个独立 HTML 单页，放在
 * `site/public/tools/<slug>/view.html`，构建后直接由 GH Pages 静态托管，
 * 地址为 `/tools/<slug>/view.html`。
 *
 * 为什么叫 view.html 而不是 index.html：详情页路由 `/tools/<slug>` 在
 * 静态导出时同样会产出 `dist/tools/<slug>/index.html`，同名会互相覆盖。
 *
 * 新增工具只需要两步：
 * 1. 把 HTML 放到 `site/public/tools/<slug>/view.html`
 * 2. 在 `site/data/tools.json` 追加一条记录（或执行 `just add-tool`）
 */

const FALLBACK_EMOJI = "🧩";
const TOOL_ENTRY_FILE = "view.html";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

let cachedTools: ToolMeta[] | null = null;

/** 兼容从 site/ 或仓库根目录启动的场景 */
function resolvePublicToolsDir(): string {
  const candidates = [
    path.join(process.cwd(), "public", "tools"),
    path.join(process.cwd(), "site", "public", "tools"),
  ];

  const hit = candidates.find((dir) => fs.existsSync(dir));
  return hit ?? candidates[0];
}

function fail(message: string): never {
  throw new Error(`[tools] ${message}`);
}

function normalizeTool(raw: ToolMeta, index: number): ToolMeta {
  if (!raw || typeof raw !== "object") {
    fail(`tools.json 第 ${index + 1} 条记录不是合法对象`);
  }

  const slug = raw.slug?.trim();
  const title = raw.title?.trim();
  const description = raw.description?.trim();

  if (!slug) {
    fail(`tools.json 第 ${index + 1} 条记录缺少 slug`);
  }
  if (!SLUG_PATTERN.test(slug)) {
    fail(`slug "${slug}" 不合法，只允许小写字母、数字和中划线（如 pomodoro）`);
  }
  if (!title) {
    fail(`工具 "${slug}" 缺少 title`);
  }
  if (!description) {
    fail(`工具 "${slug}" 缺少 description`);
  }

  return {
    ...raw,
    slug,
    title,
    description,
    emoji: raw.emoji?.trim() || FALLBACK_EMOJI,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag) => Boolean(tag?.trim())) : [],
  };
}

/**
 * 获取全部小工具。
 *
 * 排序优先级：
 * 1. `order` 升序（显式指定的展示位，小在前）
 * 2. 未设置 `order` 的排在最后，其中 `featured` 优先
 * 3. 其余按上线日期倒序，同日期按标题排序
 */
export function getAllTools(): ToolMeta[] {
  if (cachedTools) {
    return cachedTools;
  }

  const rawTools = (registry as { tools?: ToolMeta[] }).tools;
  if (!Array.isArray(rawTools)) {
    fail("site/data/tools.json 缺少 tools 数组");
  }

  const seen = new Set<string>();
  const tools = rawTools.map(normalizeTool);

  for (const tool of tools) {
    if (seen.has(tool.slug)) {
      fail(`slug "${tool.slug}" 重复，请保证唯一`);
    }
    seen.add(tool.slug);
  }

  const orderOf = (tool: ToolMeta): number =>
    typeof tool.order === "number" && Number.isFinite(tool.order)
      ? tool.order
      : Number.POSITIVE_INFINITY;

  tools.sort((a, b) => {
    const orderA = orderOf(a);
    const orderB = orderOf(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }
    // 都未设置 order 时，才回落到 featured
    if (orderA === Number.POSITIVE_INFINITY) {
      if (Boolean(a.featured) !== Boolean(b.featured)) {
        return a.featured ? -1 : 1;
      }
    }
    return (b.addedAt ?? "").localeCompare(a.addedAt ?? "") || a.title.localeCompare(b.title);
  });

  cachedTools = tools;
  return tools;
}

export function getToolBySlug(slug: string): ToolMeta | null {
  return getAllTools().find((tool) => tool.slug === slug) ?? null;
}

/** 站内详情页路径 */
export function getToolRoute(slug: string): string {
  return `/tools/${slug}`;
}

/** 小工具 HTML 的静态地址，用于 iframe 与新窗口打开 */
export function getToolEmbedPath(slug: string): string {
  return `/tools/${slug}/${TOOL_ENTRY_FILE}`;
}

/** 小工具 HTML 在磁盘上的绝对路径，供测试与脚本校验 */
export function getToolStaticFilePath(slug: string): string {
  return path.join(resolvePublicToolsDir(), slug, TOOL_ENTRY_FILE);
}

/** 小工具 HTML 是否已落盘 */
export function toolHtmlExists(slug: string): boolean {
  return fs.existsSync(getToolStaticFilePath(slug));
}

/**
 * 检查是否存在与详情页路由冲突的 `index.html`。
 *
 * 静态导出时详情页会占用 `dist/tools/<slug>/index.html`，
 * 若 public 下放了同名文件，构建后会被覆盖，页面变成裸 HTML。
 */
export function hasConflictingIndexHtml(slug: string): boolean {
  return fs.existsSync(path.join(resolvePublicToolsDir(), slug, "index.html"));
}
