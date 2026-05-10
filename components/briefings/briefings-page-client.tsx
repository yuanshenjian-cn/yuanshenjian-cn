"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BriefingRecommendWidget } from "@/components/briefings/briefing-recommend-widget";
import { BRIEFING_FILTER_OPTIONS, isBriefingInRange } from "@/lib/briefing-ranges";
import type { Briefing, BriefingRecommendationRange } from "@/types/briefing";

interface BriefingsPageClientProps {
  briefings: Briefing[];
  totalBriefings: number;
  aiConfig: {
    enabled: boolean;
    workerUrl: string;
    turnstileSiteKey: string;
    turnstileTimeoutMs: number;
    maxInputChars: number;
  };
}

export function BriefingsPageClient({ briefings, totalBriefings, aiConfig }: BriefingsPageClientProps) {
  const [range, setRange] = useState<Exclude<BriefingRecommendationRange, "today">>("30d");
  const activeRange: BriefingRecommendationRange = range;

  const filteredBriefings = useMemo(
    () => briefings.filter((briefing) => isBriefingInRange(briefing.date, activeRange)),
    [activeRange, briefings],
  );

  return (
    <>
      <BriefingRecommendWidget
        enabled={aiConfig.enabled}
        workerUrl={aiConfig.workerUrl}
        turnstileSiteKey={aiConfig.turnstileSiteKey}
        turnstileTimeoutMs={aiConfig.turnstileTimeoutMs}
        maxInputChars={aiConfig.maxInputChars}
      />

      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-medium tracking-tight">往期简报</h2>
            <span className="text-xs text-muted-foreground">（共 {totalBriefings} 期）</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {BRIEFING_FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRange(option.value);
                }}
                className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
                  range === option.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredBriefings.length > 0 ? (
            filteredBriefings.map((briefing) => (
              <Link
                key={briefing.slug}
                href={briefing.url}
                className="block rounded-xl border px-4 py-4 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-medium tracking-tight">{briefing.title}</h3>
                  <time className="text-xs text-muted-foreground" dateTime={briefing.date}>
                    {new Date(briefing.date).toLocaleDateString("zh-CN")}
                  </time>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{briefing.excerpt}</p>
                {briefing.tags.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {briefing.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              这个时间范围内还没有 AI 简报。
            </p>
          )}
        </div>

        {totalBriefings > briefings.length ? (
          <div className="mt-6 rounded-2xl border bg-card/60 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">查看更早简报</h3>
                <p className="mt-1 text-sm text-muted-foreground">按月份浏览历史 AI 简报</p>
              </div>
              <Link
                href="/ai/daily-briefings/archive"
                className="rounded-xl border px-4 py-2 text-sm transition hover:border-primary/40 hover:bg-muted/30"
              >
                查看归档
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
