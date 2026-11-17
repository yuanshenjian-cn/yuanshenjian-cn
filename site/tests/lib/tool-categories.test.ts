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
  { slug: "body-metrics", title: "身体指标", description: "BMI", category: "运动健康" },
  { slug: "pomodoro", title: "番茄钟", description: "专注计时", category: "时间效率" },
  { slug: "mortgage", title: "房贷计算器", description: "等额本息", category: "投资理财" },
  { slug: "tax", title: "个税计算器", description: "专项扣除", category: "投资理财" },
];

describe("工具分类", () => {
  describe("getToolCategory", () => {
    it("优先使用 category", () => {
      expect(getToolCategory(sample[0])).toBe("运动健康");
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
    it("按 categoryOrder 排序，同名合并且计数正确", () => {
      // tool 顺序是 运动健康 / 时间效率 / 投资理财，但展示顺序以 categoryOrder 为准
      expect(getToolCategories(sample)).toEqual([
        { name: "运动健康", count: 1 },
        { name: "投资理财", count: 2 },
        { name: "时间效率", count: 1 },
      ]);
    });

    it("未登记顺序的分类排在已登记的后面，且保持首次出现顺序", () => {
      const extra: ToolMeta[] = [
        { slug: "a", title: "a", description: "a", category: "冷门一" },
        { slug: "b", title: "b", description: "b", category: "运动健康" },
        { slug: "c", title: "c", description: "c", category: "冷门二" },
      ];
      expect(getToolCategories(extra).map((item) => item.name)).toEqual([
        "运动健康",
        "冷门一",
        "冷门二",
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
      expect(filterToolsByCategory(sample, "投资理财").map((tool) => tool.slug)).toEqual([
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
