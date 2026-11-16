import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ToolDirectory } from "@/components/tools/ToolDirectory";
import type { ToolMeta } from "@/types/tool";

const tools: ToolMeta[] = [
  {
    slug: "pomodoro",
    title: "番茄钟",
    description: "专注计时",
    emoji: "🍅",
    tags: ["专注"],
  },
  {
    slug: "calendar",
    title: "日历",
    description: "周月年三视图",
    emoji: "📅",
    tags: ["效率"],
  },
];

function prefetchLinks() {
  return Array.from(document.head.querySelectorAll('link[rel="prefetch"]'));
}

afterEach(() => {
  prefetchLinks().forEach((link) => link.remove());
});

describe("ToolDirectory 预取", () => {
  it("悬停卡片时预取对应工具页文档，且只预取一次", () => {
    render(<ToolDirectory tools={tools} />);

    const link = screen.getByRole("link", { name: /番茄钟/ });
    fireEvent.mouseOver(link);
    fireEvent.mouseOver(link);

    const prefetched = prefetchLinks();
    expect(prefetched).toHaveLength(1);
    expect(prefetched[0].getAttribute("href")).toBe("/tools/pomodoro/view.html");
    expect(prefetched[0].getAttribute("as")).toBe("document");
  });

  it("键盘聚焦同样触发预取", () => {
    render(<ToolDirectory tools={tools} />);

    fireEvent.focus(screen.getByRole("link", { name: /日历/ }));

    expect(prefetchLinks().map((link) => link.getAttribute("href"))).toEqual([
      "/tools/calendar/view.html",
    ]);
  });
});
