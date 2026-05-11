import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { generateListPageSEO } from "@/lib/seo-utils";
import { config } from "@/lib/config";
import { getInvestmentBriefingArchives } from "@/lib/investment-briefings";

export const metadata: Metadata = generateListPageSEO(
  "投资简报历史归档",
  "按月份浏览更早的投资简报。",
  `${config.site.url}/investment/briefings/archive`,
);

export default function InvestmentBriefingArchivePage() {
  const archives = getInvestmentBriefingArchives();

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/investment/briefings" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回投资简报
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">历史归档</h1>
          <p className="mt-2 text-sm text-muted-foreground">按月份浏览更早的投资简报。</p>
        </header>

        <div className="space-y-3">
          {archives.length > 0 ? (
            archives.map((archive) => (
              <Link
                key={`${archive.year}-${archive.month}`}
                href={archive.url}
                className="block rounded-xl border px-4 py-4 transition hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-medium tracking-tight">{archive.year} 年 {archive.month} 月</h2>
                  <span className="text-xs text-muted-foreground">{archive.count} 期</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{archive.startDate} ~ {archive.endDate}</p>
              </Link>
            ))
          ) : (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              暂时还没有历史投资简报。
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
