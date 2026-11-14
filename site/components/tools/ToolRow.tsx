import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolMeta } from "@/types/tool";

interface ToolRowProps {
  tool: ToolMeta;
}

export function ToolRow({ tool }: ToolRowProps) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/50"
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm"
      >
        {tool.emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-medium tracking-tight transition-colors group-hover:text-primary">
            {tool.title}
          </h2>
          {tool.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{tool.description}</p>
      </div>

      {tool.addedAt && (
        <span className="hidden shrink-0 text-[11px] text-muted-foreground/70 sm:block">
          {tool.addedAt}
        </span>
      )}
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}
