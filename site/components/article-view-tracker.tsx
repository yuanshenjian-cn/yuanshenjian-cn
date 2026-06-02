"use client";

import { useEffect, useState } from "react";
import { recordArticleView } from "@/lib/core-service-client";

export function ArticleViewTracker({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    void recordArticleView(slug).then((stats) => {
      if (stats) {
        setSummary(`阅读 ${stats.pv} · 访客 ${stats.uv}`);
      }
    });
  }, [slug]);

  return summary ? <div className="mx-auto max-w-2xl px-6 pt-6 text-xs text-muted-foreground">{summary}</div> : null;
}
