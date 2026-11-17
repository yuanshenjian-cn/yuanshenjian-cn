import registry from "@/data/tools.json";
import type { ToolCategory, ToolMeta } from "@/types/tool";

/**
 * 分类聚合（纯函数）。
 *
 * 单独成文件而不是放进 `lib/tools.ts`：后者依赖 `fs`/`path` 读取磁盘，
 * 只能跑在服务端；而列表页的分类筛选条是客户端组件，直接引会打爆打包。
 */

/** 未填写 category 时的兜底分类，保证工具不会在筛选条里消失 */
export const DEFAULT_TOOL_CATEGORY = "其他";

/** 全部分类的展示名（虚拟分类，不对应任何工具） */
export const ALL_TOOL_CATEGORY = "全部";

/** 分类的展示顺序，登记在 `data/tools.json` 的 `categoryOrder` */
const CATEGORY_ORDER: string[] = Array.isArray((registry as { categoryOrder?: string[] }).categoryOrder)
  ? ((registry as { categoryOrder?: string[] }).categoryOrder as string[])
  : [];

export function getToolCategory(tool: ToolMeta): string {
  return tool.category?.trim() || DEFAULT_TOOL_CATEGORY;
}

/**
 * 汇总分类及数量。
 *
 * 顺序以 `data/tools.json` 的 `categoryOrder` 为准；没登记的分类
 * 按在工具列表里首次出现的顺序追加在后面（sort 在现代 JS 里是稳定的），
 * 这样新增分类不会因为忘登记就把顺序打乱。
 */
export function getToolCategories(tools: ToolMeta[]): ToolCategory[] {
  const counters = new Map<string, number>();

  for (const tool of tools) {
    const name = getToolCategory(tool);
    counters.set(name, (counters.get(name) ?? 0) + 1);
  }

  const rank = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));
  const rankOf = (name: string): number => rank.get(name) ?? Number.MAX_SAFE_INTEGER;

  return Array.from(counters, ([name, count]) => ({ name, count })).sort(
    (a, b) => rankOf(a.name) - rankOf(b.name),
  );
}

/** 按分类过滤，`null` 表示不筛选 */
export function filterToolsByCategory(tools: ToolMeta[], category: string | null): ToolMeta[] {
  if (!category) {
    return tools;
  }
  return tools.filter((tool) => getToolCategory(tool) === category);
}
