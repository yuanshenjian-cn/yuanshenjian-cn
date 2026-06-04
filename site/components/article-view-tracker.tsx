"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { recordArticleView, type ArticleStats } from "@/lib/core-service-client";

export function ArticleViewTracker({ slug }: { slug: string }) {
  const [stats, setStats] = useState<ArticleStats | null>(null);

  useEffect(() => {
    void recordArticleView(slug).then((result) => {
      if (result) {
        setStats(result);
      }
    }).catch(() => {
      // Ignore transient view sync failures so article content remains readable.
    });
  }, [slug]);

  if (!stats) return null;

  return (
    <>
      <span>·</span>
      <span className="flex items-center gap-1">
        <Eye className="w-4 h-4" />
        {stats.pv}
      </span>
      <span className="flex items-center gap-1">
        <Users className="w-4 h-4" />
        {stats.uv}
      </span>
    </>
  );
}
