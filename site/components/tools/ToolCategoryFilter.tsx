"use client";

import type { ToolCategory } from "@/types/tool";
import { ALL_TOOL_CATEGORY } from "@/lib/tool-categories";

interface ToolCategoryFilterProps {
  /** 全部分类下的工具总数 */
  total: number;
  categories: ToolCategory[];
  /** 当前选中的分类，`null` 表示未筛选 */
  active: string | null;
  onSelect: (category: string | null) => void;
}

interface ChipProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

function Chip({ label, count, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}，共 ${count} 个工具`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-transparent bg-primary font-medium text-primary-foreground"
          : "text-muted-foreground hover:border-foreground/25 hover:text-foreground"
      }`}
    >
      {label}
      <span className={`text-[11px] tabular-nums ${active ? "opacity-70" : "opacity-55"}`}>
        {count}
      </span>
    </button>
  );
}

/**
 * 分类筛选条。
 *
 * 只有一个分类时筛选没有意义，直接不渲染，免得占位。
 */
export function ToolCategoryFilter({ total, categories, active, onSelect }: ToolCategoryFilterProps) {
  if (categories.length <= 1) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label="按分类筛选工具"
      className="mb-6 flex flex-wrap items-center gap-2"
    >
      <Chip
        label={ALL_TOOL_CATEGORY}
        count={total}
        active={active === null}
        onClick={() => onSelect(null)}
      />
      {categories.map(({ name, count }) => (
        <Chip
          key={name}
          label={name}
          count={count}
          active={active === name}
          // 再次点击已选中的分类＝取消筛选，省一次回「全部」的操作
          onClick={() => onSelect(active === name ? null : name)}
        />
      ))}
    </div>
  );
}
