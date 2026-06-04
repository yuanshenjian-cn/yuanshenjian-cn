import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleStatsBadge } from "@/components/article-stats-badge";
import { getBriefingArchives, getBriefingsByMonth } from "@/lib/briefings";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

interface Props {
  params: Promise<{ year: string; month: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getBriefingArchives().map((archive) => ({
    year: archive.year,
    month: archive.month,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month } = await params;
  const briefings = getBriefingsByMonth(year, month);

  if (briefings.length === 0) {
    return { title: "归档未找到" };
  }

  return generateListPageSEO(
    `${year} 年 ${month} 月 AI 简报`,
    `${year} 年 ${month} 月 AI 简报归档列表。`,
    `${config.site.url}/ai/briefings/archive/${year}/${month}`,
  );
}

export default async function BriefingArchiveMonthPage({ params }: Props) {
  const { year, month } = await params;
  const briefings = getBriefingsByMonth(year, month);

  if (briefings.length === 0) {
    notFound();
  }

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/ai/briefings/archive" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回历史归档
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight">{year} 年 {month} 月</h1>
          <p className="mt-2 text-sm text-muted-foreground">共 {briefings.length} 期 AI 简报</p>
        </header>

        <div className="space-y-3">
          {briefings.map((briefing) => (
            <Link
              key={briefing.slug}
              href={briefing.url}
              className="block rounded-xl border px-4 py-4 transition hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-medium tracking-tight">{briefing.title}</h2>
                <time className="text-xs text-muted-foreground" dateTime={briefing.date}>
                  {new Date(briefing.date).toLocaleDateString("zh-CN")}
                </time>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{briefing.excerpt}</p>
              <ArticleStatsBadge slug={`ai-briefing-${briefing.slug}`} className="mt-3" />
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
          ))}
        </div>
      </div>
    </main>
  );
}
