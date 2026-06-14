import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Newspaper } from "lucide-react";
import { AiRecommendWidget } from "@/components/ai/AiRecommendWidget";
import { getAllPosts } from "@/lib/blog";
import { getLatestBriefing } from "@/lib/briefings";
import { config } from "@/lib/config";
import { getLatestInvestmentBriefing } from "@/lib/investment-briefings";
import { generateListPageSEO } from "@/lib/seo-utils";

const homepageSeo = generateListPageSEO(
  config.site.name,
  config.site.description,
  config.site.url,
);

export const metadata: Metadata = {
  ...homepageSeo,
  title: "YSJ 主页",
  openGraph: {
    ...homepageSeo.openGraph,
    title: "YSJ 主页",
  },
  twitter: {
    ...homepageSeo.twitter,
    title: "YSJ 主页",
  },
};

export default function Home() {
  const posts = getAllPosts();
  const recentPosts = posts.slice(0, 3);
  const latestBriefing = getLatestBriefing();
  const latestInvestmentBriefing = getLatestInvestmentBriefing();

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/home/hero-bg.webp')`,
          }}
        />
        {/* Overlay Gradient - 更柔和的渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        
        {/* Content */}
        <div className="relative z-10 w-full py-12 px-6">
          <div className="max-w-2xl mx-auto text-center">
            {/* 主标题 */}
            <h1 className="text-4xl md:text-5xl lg:text-5xl font-light tracking-tight mb-6 text-foreground">
              记录思考，分享成长
            </h1>

            {/* 副标题 */}
            <p className="text-lg md:text-xl text-foreground/80 max-w-lg mx-auto leading-relaxed font-light">
              AI 效能 · 敏捷方法 · 生活随笔
            </p>
          </div>

          {/* AI 推荐 */}
          <div className="max-w-2xl mx-auto mt-10 mb-8">
            <AiRecommendWidget
              enabled={config.ai.enabled}
              workerUrl={config.ai.workerUrl}
              turnstileSiteKey={config.ai.turnstileSiteKey}
              turnstileTimeoutMs={config.ai.turnstile.timeoutMs.homepageRecommend}
              maxInputChars={config.ai.maxInputChars}
              quickTopics={config.ai.quickTopics}
            />
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border bg-background/72 p-5 shadow-sm backdrop-blur-sm min-h-[196px]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        AI 简报
                      </p>
                    </div>
                  </div>

                  {latestBriefing ? (
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={latestBriefing.date}>
                      {new Date(latestBriefing.date).toLocaleDateString("zh-CN")}
                    </time>
                  ) : null}
                </div>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-foreground/75">
                  {latestBriefing
                    ? latestBriefing.excerpt
                    : "持续追踪重点 AI 厂商的确定性动态，有更新时发布新一期简报。"}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/ai/briefings/latest"
                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition hover:bg-foreground/90"
                  >
                    看最新
                    <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                  <Link
                    href="/ai/briefings"
                    className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    看往期
                  </Link>
                </div>
              </section>

              <section className="rounded-2xl border bg-background/72 p-5 shadow-sm backdrop-blur-sm min-h-[196px]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Newspaper className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        投资简报
                      </p>
                    </div>
                  </div>

                  {latestInvestmentBriefing ? (
                    <time className="shrink-0 text-xs text-muted-foreground" dateTime={latestInvestmentBriefing.date}>
                      {new Date(latestInvestmentBriefing.date).toLocaleDateString("zh-CN")}
                    </time>
                  ) : null}
                </div>

                <p className="mt-4 line-clamp-4 text-sm leading-6 text-foreground/75">
                  {latestInvestmentBriefing
                    ? latestInvestmentBriefing.excerpt
                    : "持续整理重点公司的公开动态与未来观察，帮助你快速把握最新投资线索。"}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href="/investment/briefings/latest"
                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition hover:bg-foreground/90"
                  >
                    看最新
                    <ArrowRight className="h-2.5 w-2.5" />
                  </Link>
                  <Link
                    href="/investment/briefings"
                    className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    看往期
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

    {/* Latest Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-medium text-foreground">最新文章</h2>
              <Link
                href="/articles"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
              </Link>
            </div>

            <div className="space-y-8">
              {recentPosts.map((post) => (
                <article key={post.slug} className="group">
                  <Link href={`/articles/${post.slug}`} className="block">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("zh-CN")}
                      </time>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
