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

export function getToolCategory(tool: ToolMeta): string {
  return tool.category?.trim() || DEFAULT_TOOL_CATEGORY;
}

/**
 * 按工具列表顺序汇总分类。
 *
 * 顺序跟随传入的展示顺序（`getAllTools` 已按 order 排好），
 * 这样第一个工具所属的分类会排在最前，权重自然浮上来。
 */
export function getToolCategories(tools: ToolMeta[]): ToolCategory[] {
  const counters = new Map<string, number>();

  for (const tool of tools) {
    const name = getToolCategory(tool);
    counters.set(name, (counters.get(name) ?? 0) + 1);
  }

  return Array.from(counters, ([name, count]) => ({ name, count }));
}

/** 按分类过滤，`null` 表示不筛选 */
export function filterToolsByCategory(tools: ToolMeta[], category: string | null): ToolMeta[] {
  if (!category) {
    return tools;
  }
  return tools.filter((tool) => getToolCategory(tool) === category);
}
