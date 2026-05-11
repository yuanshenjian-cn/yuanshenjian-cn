import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FloatingTocButton } from "@/components/floating-toc-button";
import { ShareButtons } from "@/components/share-buttons";
import { TableOfContents } from "@/components/table-of-contents";
import { config } from "@/lib/config";
import {
  getAdjacentInvestmentBriefings,
  getAllInvestmentBriefings,
  getInvestmentBriefingBySlug,
  getLatestInvestmentBriefing,
} from "@/lib/investment-briefings";
import { MDXContent, extractHeadings } from "@/lib/mdx";

function getDisplayTag(tag: string): string {
  return tag === "投资简报" ? "投资" : tag;
}

export const dynamicParams = false;

interface Props {
  params: Promise<{ date: string }>;
}

export function generateStaticParams() {
  const params = getAllInvestmentBriefings().map((briefing) => ({
    date: briefing.slug,
  }));

  return params.length > 0 ? [...params, { date: "latest" }] : [{ date: "__empty__" }, { date: "latest" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const briefing = date === "latest" ? getLatestInvestmentBriefing() : getInvestmentBriefingBySlug(date);

  if (!briefing) {
    return {
      title: "投资简报 | YSJ",
    };
  }

  const isLatestRoute = date === "latest";
  const url = `${config.site.url}${isLatestRoute ? "/investment/briefings/latest" : briefing.url}`;
  const ogImage = `${url}/opengraph-image`;
  const shareTitle = isLatestRoute ? "投资简报 · Latest | YSJ" : briefing.title;
  const shareDescription = isLatestRoute
    ? "投资简报的最新一期内容入口，适合长期收藏、固定访问与持续跟踪最新的投资观察。"
    : briefing.excerpt;

  return {
    title: isLatestRoute ? "投资简报 · Latest | YSJ" : `${briefing.title} | YSJ`,
    description: shareDescription,
    keywords: briefing.tags,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: shareTitle,
      description: shareDescription,
      url,
      siteName: "YSJ 主页",
      locale: config.site.locale,
      type: "article",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${briefing.title} | ${config.site.name}`,
        },
      ],
      publishedTime: briefing.date,
      modifiedTime: briefing.date,
      tags: briefing.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: shareDescription,
      images: [ogImage],
    },
    robots: isLatestRoute ? { index: false, follow: true } : undefined,
  };
}

export default async function InvestmentBriefingDetailPage({ params }: Props) {
  const { date } = await params;

  if (date === "__empty__") {
    notFound();
  }

  const briefing = date === "latest" ? getLatestInvestmentBriefing() : getInvestmentBriefingBySlug(date);
  if (!briefing) {
    notFound();
  }

  const { prev, next } = getAdjacentInvestmentBriefings(briefing.slug);
  const headings = extractHeadings(briefing.content);
  const url = `${config.site.url}${date === "latest" ? "/investment/briefings/latest" : briefing.url}`;
  const shareTitle = date === "latest" ? "投资简报 · Latest | YSJ" : briefing.title;
  const shareDescription = date === "latest"
    ? "投资简报的最新一期内容入口，适合长期收藏、固定访问与持续跟踪最新的投资观察。"
    : briefing.excerpt;

  return (
    <>
      <article className="py-12 px-6">
        <div className="max-w-6xl mx-auto lg:flex lg:justify-center lg:gap-8">
          <div className="w-full max-w-2xl mx-auto lg:mx-0 overflow-hidden">
            <nav className="mb-8 text-sm text-muted-foreground">
              <Link href="/investment/briefings" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" />
                投资简报
              </Link>
            </nav>

            <header className="mb-10">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Briefing</p>
              <h1 className="text-3xl font-medium tracking-tight leading-tight">{briefing.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <time dateTime={briefing.date}>{new Date(briefing.date).toLocaleDateString("zh-CN")}</time>
                <span>{briefing.readingTime} 分钟阅读</span>
              </div>
              <p className="mt-5 rounded-2xl border bg-muted/30 px-4 py-3 text-sm leading-6 text-muted-foreground">
                {briefing.excerpt}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {briefing.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {getDisplayTag(tag)}
                  </span>
                ))}
              </div>
            </header>

            {headings.length > 0 ? (
              <div className="my-8 lg:hidden">
                <div className="rounded-lg border bg-card p-4">
                  <TableOfContents headings={headings} />
                </div>
              </div>
            ) : null}

            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <MDXContent source={briefing.content} />
            </div>

            <div className="mt-10">
              <ShareButtons url={url} title={shareTitle} description={shareDescription} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link href={prev.url} className="rounded-xl border p-4 transition hover:bg-muted/40">
                  <p className="mb-2 text-xs text-muted-foreground">上一期</p>
                  <h2 className="text-sm font-medium">{prev.title}</h2>
                </Link>
              ) : <div />}
              {next ? (
                <Link href={next.url} className="rounded-xl border p-4 text-right transition hover:bg-muted/40">
                  <p className="mb-2 text-xs text-muted-foreground">下一期</p>
                  <h2 className="inline-flex items-center justify-end gap-1 text-sm font-medium">
                    {next.title}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </h2>
                </Link>
              ) : <div />}
            </div>
          </div>

          {headings.length > 0 ? (
            <aside className="hidden w-60 flex-shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="rounded-lg border bg-card p-4">
                  <TableOfContents headings={headings} />
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </article>

      {headings.length > 0 ? <FloatingTocButton headings={headings} /> : null}
    </>
  );
}
