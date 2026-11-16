import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ToolDirectory } from "@/components/tools/ToolDirectory";
import type { ToolMeta } from "@/types/tool";

const tools: ToolMeta[] = [
  {
    slug: "body-metrics",
    title: "身体指标",
    description: "BMI 与心率区间",
    category: "健康健身",
    tags: ["健身"],
  },
  {
    slug: "pomodoro",
    title: "番茄钟",
    description: "专注计时",
    category: "时间效率",
    tags: ["效率"],
  },
  {
    slug: "mortgage",
    title: "房贷计算器",
    description: "等额本息与等额本金",
    category: "理财计算",
    tags: ["理财"],
  },
  {
    slug: "tax",
    title: "个税计算器",
    description: "专项附加扣除",
    category: "理财计算",
    tags: ["计算"],
  },
];

/** 当前渲染出来的工具标题 */
function cardTitles() {
  return screen.queryAllByRole("heading", { level: 2 }).map((node) => node.textContent);
}

function filterGroup() {
  return screen.getByRole("group", { name: "按分类筛选工具" });
}

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState(null, "", "/tools");
});

afterEach(() => {
  window.history.replaceState(null, "", "/tools");
});

describe("ToolDirectory 分类筛选", () => {
  it("按工具顺序展示分类与数量，「全部」排第一", () => {
    render(<ToolDirectory tools={tools} />);

    const chips = within(filterGroup()).getAllByRole("button");
    expect(chips.map((chip) => chip.getAttribute("aria-label"))).toEqual([
      "全部，共 4 个工具",
      "健康健身，共 1 个工具",
      "时间效率，共 1 个工具",
      "理财计算，共 2 个工具",
    ]);
  });

  it("默认选中「全部」，展示所有工具", () => {
    render(<ToolDirectory tools={tools} />);

    expect(cardTitles()).toEqual(["身体指标", "番茄钟", "房贷计算器", "个税计算器"]);
    expect(screen.getByRole("button", { name: /^全部/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("点击分类只保留该分类的工具，并切换选中态", () => {
    render(<ToolDirectory tools={tools} />);

    fireEvent.click(screen.getByRole("button", { name: /^理财计算/ }));

    expect(cardTitles()).toEqual(["房贷计算器", "个税计算器"]);
    expect(screen.getByRole("button", { name: /^理财计算/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^全部/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("再次点击已选分类＝取消筛选", () => {
    render(<ToolDirectory tools={tools} />);

    const chip = screen.getByRole("button", { name: /^时间效率/ });
    fireEvent.click(chip);
    expect(cardTitles()).toEqual(["番茄钟"]);

    fireEvent.click(chip);
    expect(cardTitles()).toHaveLength(tools.length);
    expect(screen.getByRole("button", { name: /^全部/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("点「全部」可以从任意分类回到全量", () => {
    render(<ToolDirectory tools={tools} />);

    fireEvent.click(screen.getByRole("button", { name: /^健康健身/ }));
    expect(cardTitles()).toEqual(["身体指标"]);

    fireEvent.click(screen.getByRole("button", { name: /^全部/ }));
    expect(cardTitles()).toHaveLength(tools.length);
  });

  it("筛选状态写进 URL，刷新后仍能还原", () => {
    render(<ToolDirectory tools={tools} />);

    fireEvent.click(screen.getByRole("button", { name: /^理财计算/ }));
    expect(new URLSearchParams(window.location.search).get("cat")).toBe("理财计算");

    // 回到「全部」时清掉参数，避免脏 URL 影响分享
    fireEvent.click(screen.getByRole("button", { name: /^全部/ }));
    expect(new URLSearchParams(window.location.search).get("cat")).toBeNull();
  });

  it("带 cat 参数进入时直接应用筛选", () => {
    window.history.replaceState(null, "", `/tools?cat=${encodeURIComponent("时间效率")}`);

    render(<ToolDirectory tools={tools} />);

    expect(cardTitles()).toEqual(["番茄钟"]);
    expect(screen.getByRole("button", { name: /^时间效率/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("URL 里的脏分类直接忽略，回落到全部", () => {
    window.history.replaceState(null, "", "/tools?cat=not-a-category");

    render(<ToolDirectory tools={tools} />);

    expect(cardTitles()).toHaveLength(tools.length);
    expect(screen.getByRole("button", { name: /^全部/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("只有一个分类时不渲染筛选条", () => {
    const single = tools.filter((tool) => tool.category === "理财计算");

    render(<ToolDirectory tools={single} />);

    expect(screen.queryByRole("group", { name: "按分类筛选工具" })).toBeNull();
    expect(cardTitles()).toEqual(["房贷计算器", "个税计算器"]);
  });

  it("列表样式下同样生效", () => {
    render(<ToolDirectory tools={tools} />);

    fireEvent.click(screen.getByRole("button", { name: "列表样式" }));
    fireEvent.click(screen.getByRole("button", { name: /^健康健身/ }));

    expect(cardTitles()).toEqual(["身体指标"]);
  });
});
