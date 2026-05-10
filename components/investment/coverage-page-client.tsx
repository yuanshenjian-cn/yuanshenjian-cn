"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InvestmentCoverageData, InvestmentMarket, InvestmentPriority } from "@/types/investment";

interface CoveragePageClientProps {
  coverage: InvestmentCoverageData;
  latestBriefingUrl: string | null;
}

const PRIORITY_FILTERS: Array<{ value: "all" | InvestmentPriority; label: string }> = [
  { value: "all", label: "全部" },
  { value: "core", label: "核心" },
  { value: "important", label: "重要" },
  { value: "event-driven", label: "事件驱动" },
];

const MARKET_FILTERS: Array<{ value: "all" | InvestmentMarket; label: string }> = [
  { value: "all", label: "全部" },
  { value: "A股", label: "A股" },
  { value: "港股", label: "港股" },
  { value: "美股", label: "美股" },
];

const PRIORITY_LABELS: Record<InvestmentPriority, string> = {
  core: "核心",
  important: "重要",
  "event-driven": "事件驱动",
};

const AREA_TYPE_LABELS = {
  index: "指数",
  theme: "主题",
  sector: "板块",
  industry: "行业",
  style: "风格",
} as const;

export function CoveragePageClient({ coverage, latestBriefingUrl }: CoveragePageClientProps) {
  const [priority, setPriority] = useState<"all" | InvestmentPriority>("all");
  const [market, setMarket] = useState<"all" | InvestmentMarket>("all");

  const areas = useMemo(
    () => coverage.areas.filter((area) => priority === "all" || area.priority === priority),
    [coverage.areas, priority],
  );

  const companies = useMemo(
    () => coverage.companies.filter((company) => market === "all" || company.market === market),
    [coverage.companies, market],
  );

  return (
    <main className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <section className="rounded-3xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Coverage Statement</p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight">{coverage.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">{coverage.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={latestBriefingUrl ?? "/investment/daily-briefings"}
              className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground/90"
            >
              阅读最新简报
            </Link>
            <Link
              href="/investment/daily-briefings"
              className="inline-flex items-center rounded-full border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              查看往期简报
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {coverage.methodCards.map((card) => (
            <div key={card.title} className="rounded-2xl border bg-card/60 p-5">
              <h2 className="text-base font-medium tracking-tight">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-medium tracking-tight">重点观察领域</h2>
              <p className="mt-1 text-sm text-muted-foreground">公开展示重点观察样本，不等于全市场覆盖。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setPriority(item.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    priority === item.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {areas.map((area) => (
              <article key={area.name} className="rounded-2xl border p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium tracking-tight">{area.name}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{AREA_TYPE_LABELS[area.type]}</span>
                  <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{PRIORITY_LABELS[area.priority]}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{area.publicSummary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {area.publicTags.map((tag) => (
                    <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-medium tracking-tight">重点观察公司</h2>
              <p className="mt-1 text-sm text-muted-foreground">公开展示重点观察样本，不构成个股推荐。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {MARKET_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMarket(item.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    market === item.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {companies.map((company) => (
              <article key={`${company.market}-${company.ticker}`} className="rounded-2xl border p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-medium tracking-tight">{company.name}</h3>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{company.ticker}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{company.market}</span>
                  <span className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">{PRIORITY_LABELS[company.priority]}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{company.publicSummary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.publicFocusPoints.map((point) => (
                    <span key={point} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {point}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border bg-card/60 p-6">
          <h2 className="text-xl font-medium tracking-tight">覆盖边界</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            {coverage.boundaryStatements.map((statement) => (
              <li key={statement}>- {statement}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border bg-card/60 p-6">
          <h2 className="text-xl font-medium tracking-tight">更新方式</h2>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
            <li>- 北京时间早报，按市场时段驱动更新。</li>
            <li>- 公开稿只纳入已确认事实与已官宣未来事件。</li>
            <li>- 高共识预期默认关闭，传闻不进入公开发布内容。</li>
          </ul>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{coverage.disclaimer}</p>
        </section>
      </div>
    </main>
  );
}
