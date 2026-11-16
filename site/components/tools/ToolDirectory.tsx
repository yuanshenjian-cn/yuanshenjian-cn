"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { filterToolsByCategory, getToolCategories } from "@/lib/tool-categories";
import type { ToolMeta, ToolViewMode } from "@/types/tool";
import { ToolCard } from "./ToolCard";
import { ToolCategoryFilter } from "./ToolCategoryFilter";
import { ToolRow } from "./ToolRow";

const VIEW_MODE_STORAGE_KEY = "ysj-tools-view-mode";
/** 分类筛选写进 URL，刷新和分享都能保住当前筛选 */
const CATEGORY_QUERY_KEY = "cat";

interface ToolDirectoryProps {
  tools: ToolMeta[];
}

const VIEW_OPTIONS: Array<{
  mode: ToolViewMode;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { mode: "card", label: "卡片样式", Icon: LayoutGrid },
  { mode: "list", label: "列表样式", Icon: List },
];

export function ToolDirectory({ tools }: ToolDirectoryProps) {
  const [viewMode, setViewMode] = useState<ToolViewMode>("card");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const prefetchedSlugs = useRef<Set<string>>(new Set());
  const urlCategoryApplied = useRef(false);

  const categories = useMemo(() => getToolCategories(tools), [tools]);
  const visibleTools = useMemo(
    () => filterToolsByCategory(tools, activeCategory),
    [tools, activeCategory],
  );

  // 悬念时预取工具页的 iframe 文档，点进去时直接命中缓存；弱网/省流模式跳过
  const prefetchToolDoc = (slug: string) => {
    if (!slug || prefetchedSlugs.current.has(slug)) return;

    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
    ).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "")) return;

    prefetchedSlugs.current.add(slug);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.setAttribute("as", "document");
    link.href = `/tools/${slug}/view.html`;
    document.head.appendChild(link);
  };

  const handleToolIntent = (event: React.SyntheticEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="/tools/"]');
    const slug = anchor?.getAttribute("href")?.split("/").filter(Boolean)[1];
    if (slug) prefetchToolDoc(slug);
  };

  // 读取上次选择的展示样式；放在副作用里避免水合不一致
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (stored === "card" || stored === "list") {
        setViewMode(stored);
      }
    } catch {
      // 隐私模式下 localStorage 不可用时保持默认卡片样式
    }
  }, []);

  // 从 URL 还原分类，只认已存在的分类，脏参数直接忽略
  useEffect(() => {
    if (urlCategoryApplied.current) return;
    urlCategoryApplied.current = true;

    const fromUrl = new URLSearchParams(window.location.search).get(CATEGORY_QUERY_KEY);
    if (fromUrl && categories.some((category) => category.name === fromUrl)) {
      setActiveCategory(fromUrl);
    }
  }, [categories]);

  const changeViewMode = (mode: ToolViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // 写入失败不影响当前会话的切换效果
    }
  };

  const changeCategory = (category: string | null) => {
    setActiveCategory(category);
    try {
      const url = new URL(window.location.href);
      if (category) {
        url.searchParams.set(CATEGORY_QUERY_KEY, category);
      } else {
        url.searchParams.delete(CATEGORY_QUERY_KEY);
      }
      window.history.replaceState(null, "", url.toString());
    } catch {
      // history 不可用时只保留内存态，不影响筛选本身
    }
  };

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-medium tracking-tight">小工具</h1>
          <p className="text-sm text-muted-foreground">
            开箱即用，数据在你的浏览器里
          </p>
        </div>

        <div
          role="group"
          aria-label="展示样式"
          className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5"
        >
          {VIEW_OPTIONS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => changeViewMode(mode)}
              aria-pressed={viewMode === mode}
              aria-label={label}
              title={label}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                viewMode === mode
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      {tools.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          还没有小工具。把 HTML 放到 <code>site/public/tools/&lt;slug&gt;/view.html</code>，
          再到 <code>site/data/tools.json</code> 登记一条即可。
        </div>
      ) : (
        <>
          <ToolCategoryFilter
            total={tools.length}
            categories={categories}
            active={activeCategory}
            onSelect={changeCategory}
          />

          <div
            onMouseOver={handleToolIntent}
            onFocus={handleToolIntent}
            onPointerDown={handleToolIntent}
          >
            {visibleTools.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                这个分类下还没有工具，换一个标签看看。
              </div>
            ) : viewMode === "card" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {visibleTools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            ) : (
              <div className="divide-y overflow-hidden rounded-xl border">
                {visibleTools.map((tool) => (
                  <ToolRow key={tool.slug} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
