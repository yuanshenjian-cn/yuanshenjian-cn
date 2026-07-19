"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { fetchArticleStats, type ArticleStats } from "@/lib/core-service-client";
import { cn } from "@/lib/utils";

interface ArticleStatsBadgeProps {
  slug: string;
  className?: string;
}

export function ArticleStatsBadge({ slug, className }: ArticleStatsBadgeProps) {
  const [stats, setStats] = useState<ArticleStats | null>(null);

  useEffect(() => {
    let active = true;
    setStats(null);

    void fetchArticleStats(slug).then((result) => {
      if (active && result) {
        setStats(result);
      }
    }).catch(() => {
      // Ignore transient stats fetch failures and keep the card usable.
    });

    return () => {
      active = false;
    };
  }, [slug]);

  if (!stats) {
    return null;
  }

  return (
    <div className={cn("flex flex-nowrap items-center gap-3 whitespace-nowrap text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1">
        <Eye className="w-3.5 h-3.5" />
        {stats.pv}
      </span>
      <span className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {stats.uv}
      </span>
    </div>
  );
}
