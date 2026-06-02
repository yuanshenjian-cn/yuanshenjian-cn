"use client";

import { useEffect, useState } from "react";
import { Eye, Users } from "lucide-react";
import { recordArticleView } from "@/lib/core-service-client";

interface ArticleStats {
  pv: number;
  uv: number;
}

export function ArticleViewTracker({ slug }: { slug: string }) {
  const [stats, setStats] = useState<ArticleStats | null>(null);

  useEffect(() => {
    void recordArticleView(slug).then((result) => {
      if (result) {
        setStats({ pv: result.pv, uv: result.uv });
      }
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
