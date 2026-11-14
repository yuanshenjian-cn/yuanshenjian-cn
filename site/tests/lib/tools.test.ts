import { describe, expect, it } from "vitest";

import {
  getAllTools,
  getToolBySlug,
  getToolEmbedPath,
  getToolStaticFilePath,
  hasConflictingIndexHtml,
  toolHtmlExists,
} from "@/lib/tools";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("Tools Registry", () => {
  describe("getAllTools", () => {
    it("返回非空工具列表", () => {
      const tools = getAllTools();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it("每个工具的元信息完整", () => {
      getAllTools().forEach((tool) => {
        expect(tool.slug).toBeTruthy();
        expect(tool.title).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.emoji).toBeTruthy();
      });
    });

    it("slug 唯一且只含小写字母、数字和中划线", () => {
      const tools = getAllTools();
      const slugs = tools.map((tool) => tool.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      slugs.forEach((slug) => {
        expect(slug).toMatch(SLUG_PATTERN);
      });
    });

    it("按 order 升序排列，缺省时回落到置顶与上线日期", () => {
      const tools = getAllTools();
      const firstWithoutOrder = tools.findIndex((tool) => typeof tool.order !== "number");
      const ordered = firstWithoutOrder === -1 ? tools : tools.slice(0, firstWithoutOrder);
      const rest = firstWithoutOrder === -1 ? [] : tools.slice(firstWithoutOrder);

      // 显式指定 order 的一段必须严格升序，且排在最前
      const orders = ordered.map((tool) => tool.order as number);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);

      // 未指定 order 的一段：featured 在前，其余按上线日期倒序
      if (rest.length > 0) {
        expect(rest.every((tool) => typeof tool.order !== "number")).toBe(true);

        const firstNonFeaturedIndex = rest.findIndex((tool) => !tool.featured);
        if (firstNonFeaturedIndex !== -1) {
          expect(rest.slice(firstNonFeaturedIndex).some((tool) => tool.featured)).toBe(false);
        }

        const dates = rest.filter((tool) => !tool.featured).map((tool) => tool.addedAt ?? "");
        expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
      }
    });

    it("order 不重复，展示顺序才可确定", () => {
      const orders = getAllTools()
        .filter((tool) => typeof tool.order === "number")
        .map((tool) => tool.order);

      expect(new Set(orders).size).toBe(orders.length);
    });
  });

  describe("静态资源约定", () => {
    it("每个工具都有对应的 view.html", () => {
      getAllTools().forEach((tool) => {
        expect(
          toolHtmlExists(tool.slug),
          `${tool.slug} 缺少 ${getToolStaticFilePath(tool.slug)}`,
        ).toBe(true);
      });
    });

    it("不存在与详情页路由冲突的 index.html", () => {
      getAllTools().forEach((tool) => {
        expect(hasConflictingIndexHtml(tool.slug), `${tool.slug} 下的 index.html 会覆盖详情页`).toBe(false);
      });
    });

    it("embed 路径指向 view.html", () => {
      expect(getToolEmbedPath("pomodoro")).toBe("/tools/pomodoro/view.html");
    });
  });

  describe("getToolBySlug", () => {
    it("命中已登记工具", () => {
      const tool = getToolBySlug("pomodoro");
      expect(tool?.title).toBe("番茄钟");
    });

    it("未登记工具返回 null", () => {
      expect(getToolBySlug("not-exist-tool")).toBeNull();
    });
  });
});
