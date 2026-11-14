import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { ToolMeta } from "@/types/tool";

interface ToolCardProps {
  tool: ToolMeta;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col rounded-xl border p-5 transition-all duration-200 hover:border-foreground/25 hover:shadow-sm"
    >
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-base"
          >
            {tool.emoji}
          </span>
          <h2 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
            {tool.title}
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t pt-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {tool.tags?.map((tag) => (
            <span key={tag} className="rounded-full border px-2 py-0.5">
              {tag}
            </span>
          ))}
        </div>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}
