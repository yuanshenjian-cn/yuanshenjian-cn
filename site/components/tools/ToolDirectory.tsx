"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import type { ToolMeta, ToolViewMode } from "@/types/tool";
import { ToolCard } from "./ToolCard";
import { ToolRow } from "./ToolRow";

const VIEW_MODE_STORAGE_KEY = "ysj-tools-view-mode";

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

  const changeViewMode = (mode: ToolViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // 写入失败不影响当前会话的切换效果
    }
  };

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-medium tracking-tight">小工具</h1>
          <p className="text-sm text-muted-foreground">
            随手打开就能用，数据只留在你自己的浏览器里。
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
      ) : viewMode === "card" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-xl border">
          {tools.map((tool) => (
            <ToolRow key={tool.slug} tool={tool} />
          ))}
        </div>
      )}
    </>
  );
}
