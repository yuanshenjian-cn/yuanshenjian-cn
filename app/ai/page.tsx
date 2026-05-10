import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Newspaper } from "lucide-react";
import { getAIColumns } from "@/lib/columns";
import { getAllBriefings, getLatestBriefing } from "@/lib/briefings";
import { getColumnIconBySlug } from "@/components/column-icons";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

export const metadata: Metadata = generateListPageSEO(
  "AI 栏目",
  "AI 简报、AI 效率工程、AI Agent 与 AI Coding 相关的主题内容。",
  `${config.site.url}/ai`,
);

export default async function AIColumnsPage() {
  const columns = getAIColumns();
  const latestBriefing = getLatestBriefing();
  const briefingCount = getAllBriefings().length;
  const latestBriefingDateLabel = latestBriefing?.slug ?? latestBriefing?.date?.slice(0, 10) ?? null;

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-2xl font-medium tracking-tight mb-3">AI 栏目</h1>
        </div>

        <section className="mb-10 rounded-2xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Newspaper className="h-5 w-5" />
              </div>
              <div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {latestBriefingDateLabel ? `AI · 简报 · ${latestBriefingDateLabel}` : "AI · 简报"}
                </h2>
              </div>
            </div>
            <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
              {briefingCount} 期
            </span>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {latestBriefing
              ? latestBriefing.excerpt
              : "持续追踪重点 AI 厂商动态，经过来源与时间证据审核后发布。"}
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
                href="/ai/daily-briefings"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看往期
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <Link
                href="/ai/daily-briefings"
                className="text-[11px] text-muted-foreground transition hover:text-foreground"
              >
                查看往期
              </Link>
            </div>
          )}
        </section>

        <div className="grid gap-5 sm:grid-cols-2">
          {columns.map((column) => {
            const latestDate = column.posts.length > 0
              ? new Date(column.posts[column.posts.length - 1].date)
              : null;
            const Icon = getColumnIconBySlug(column.slug);

            return (
              <Link
                key={column.slug}
                href={`/ai/${column.slug}`}
                className="group flex flex-col rounded-xl border p-5 transition-all duration-200 hover:border-foreground/25 hover:shadow-sm"
              >
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    {Icon && <Icon className="h-6 w-6 shrink-0" />}
                    <h2 className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {column.title}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {column.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span>{column.posts.length} 篇文章</span>
                    {latestDate && (
                      <>
                        <span>·</span>
                        <span>
                          {latestDate.toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
