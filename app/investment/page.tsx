import Link from "next/link";
import { ArrowRight, BookOpen, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import { generateListPageSEO } from "@/lib/seo-utils";
import { config } from "@/lib/config";
import { getLatestInvestmentBriefing, getAllInvestmentBriefings } from "@/lib/investment-briefings";
import { getInvestmentColumns } from "@/lib/investment-columns";

export const metadata: Metadata = generateListPageSEO(
  "投资栏目",
  "投资简报、重点观察领域与投资专栏内容入口。",
  `${config.site.url}/investment`,
);

export default async function InvestmentPage() {
  const latestBriefing = getLatestInvestmentBriefing();
  const briefingCount = getAllInvestmentBriefings().length;
  const columns = getInvestmentColumns();
  const latestBriefingDateLabel = latestBriefing?.slug ?? latestBriefing?.date?.slice(0, 10) ?? null;

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-2xl font-medium tracking-tight mb-3">投资栏目</h1>
        </div>

        <section className="mb-10 rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {latestBriefingDateLabel ? `投资 · 简报 · ${latestBriefingDateLabel}` : "投资 · 简报"}
                </h2>
              </div>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              {briefingCount} 期
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {latestBriefing ? latestBriefing.excerpt : "固定观察名单为主，重大事件插播；基于公开信息整理，不构成投资建议或个股推荐。"}
          </p>

          {latestBriefing ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={latestBriefing.url}
                className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition hover:bg-foreground/90"
              >
                阅读最新
                <ArrowRight className="h-2.5 w-2.5" />
              </Link>
              <Link
                href="/investment/briefings"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看往期
              </Link>
              <Link
                href="/investment/coverage"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看观察范围
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/investment/briefings"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看往期
              </Link>
              <Link
                href="/investment/coverage"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看观察范围
              </Link>
            </div>
          )}
        </section>

        {columns.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {columns.map((column) => {
              const latestDate = column.posts.length > 0
                ? new Date(column.posts[0].date)
                : null;

              return (
                <Link
                  key={column.slug}
                  href={`/investment/${column.slug}`}
                  className="group flex flex-col rounded-xl border p-5 transition-all duration-200 hover:border-foreground/25 hover:shadow-sm"
                >
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                      <span className="rounded-full bg-primary/10 p-1.5 text-primary">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <span>{column.title}</span>
                    </h2>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      {column.description}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                      <span>{column.posts.length} 篇文章</span>
                      {latestDate ? <span>{latestDate.toLocaleDateString("zh-CN")}</span> : null}
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            投资专栏文章还在准备中。
          </p>
        )}
      </div>
    </main>
  );
}
