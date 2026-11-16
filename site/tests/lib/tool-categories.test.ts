import { describe, expect, it } from "vitest";

import {
  ALL_TOOL_CATEGORY,
  DEFAULT_TOOL_CATEGORY,
  filterToolsByCategory,
  getToolCategories,
  getToolCategory,
} from "@/lib/tool-categories";
import { getAllTools } from "@/lib/tools";
import type { ToolMeta } from "@/types/tool";

const sample: ToolMeta[] = [
  { slug: "body-metrics", title: "身体指标", description: "BMI", category: "健康健身" },
  { slug: "pomodoro", title: "番茄钟", description: "专注计时", category: "时间效率" },
  { slug: "mortgage", title: "房贷计算器", description: "等额本息", category: "理财计算" },
  { slug: "tax", title: "个税计算器", description: "专项扣除", category: "理财计算" },
];

describe("工具分类", () => {
  describe("getToolCategory", () => {
    it("优先使用 category", () => {
      expect(getToolCategory(sample[0])).toBe("健康健身");
    });

    it("缺省时归入「其他」，空白字符也算缺省", () => {
      expect(getToolCategory({ slug: "x", title: "x", description: "x" })).toBe(
        DEFAULT_TOOL_CATEGORY,
      );
      expect(
        getToolCategory({ slug: "y", title: "y", description: "y", category: "   " }),
      ).toBe(DEFAULT_TOOL_CATEGORY);
    });
  });

  describe("getToolCategories", () => {
    it("按工具顺序聚合，同名合并且计数正确", () => {
      expect(getToolCategories(sample)).toEqual([
        { name: "健康健身", count: 1 },
        { name: "时间效率", count: 1 },
        { name: "理财计算", count: 2 },
      ]);
    });

    it("空列表返回空数组", () => {
      expect(getToolCategories([])).toEqual([]);
    });
  });

  describe("filterToolsByCategory", () => {
    it("null 表示不筛选，原样返回", () => {
      expect(filterToolsByCategory(sample, null)).toBe(sample);
    });

    it("按分类过滤后仍保留原有顺序", () => {
      expect(filterToolsByCategory(sample, "理财计算").map((tool) => tool.slug)).toEqual([
        "mortgage",
        "tax",
      ]);
    });

    it("不存在的分类返回空数组", () => {
      expect(filterToolsByCategory(sample, "不存在的分类")).toEqual([]);
    });
  });

  describe("全部分类常量", () => {
    it("不与真实分类同名，避免筛选歧义", () => {
      const names = getToolCategories(getAllTools()).map((category) => category.name);
      expect(names).not.toContain(ALL_TOOL_CATEGORY);
    });
  });

  describe("注册表数据", () => {
    it("每个工具都登记了分类，列表页才不会漏", () => {
      getAllTools().forEach((tool) => {
        expect(tool.category, `${tool.slug} 缺少 category`).toBeTruthy();
        expect(tool.category).not.toBe(DEFAULT_TOOL_CATEGORY);
      });
    });

    it("分类数量可控，避免标签过于零散", () => {
      const categories = getToolCategories(getAllTools());
      expect(categories.length).toBeGreaterThanOrEqual(2);
      expect(categories.length).toBeLessThanOrEqual(6);
      expect(categories.reduce((sum, category) => sum + category.count, 0)).toBe(
        getAllTools().length,
      );
    });
  });
});
