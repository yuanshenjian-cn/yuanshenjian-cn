import Link from "next/link";
import { ArrowRight, BookOpen, Utensils, GlassWater } from "lucide-react";
import type { Metadata } from "next";

import { ContextualAIAdvisorSurface } from "@/components/ai/ContextualAIAdvisorSurface";
import { buildAdvisorContext, defaultAdvisorQuickTopics } from "@/lib/advisor-context";
import { config } from "@/lib/config";
import { getHealthColumns } from "@/lib/health-columns";
import { generateListPageSEO } from "@/lib/seo-utils";

export const metadata: Metadata = generateListPageSEO(
  "健康栏目",
  "饮食健康、运动健身与养生方向的专栏内容入口。",
  `${config.site.url}/health`,
);

export default async function HealthPage() {
  const columns = getHealthColumns();

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-2xl font-medium tracking-tight mb-3">健康栏目</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            先从饮食健康切入，后续逐步补充运动健身、养生习惯等长期专栏。
          </p>
        </div>

        {config.ai.contextualAdvisorEnabled ? (
          <ContextualAIAdvisorSurface
            context={buildAdvisorContext({
              scene: "health",
              title: "健康栏目",
              domain: "health",
              pageSlug: "health",
              quickTopics: defaultAdvisorQuickTopics("health"),
            })}
            cardTitle="AI 带你快速浏览健康栏目"
            cardDescription="如果你想知道先看哪个方向，或者这组内容更适合什么人群，可以直接问。"
            workerUrl={config.ai.workerUrl}
            turnstileSiteKey={config.ai.turnstileSiteKey}
            turnstileTimeoutMs={config.ai.turnstile.timeoutMs.contextualAdvisor}
            maxInputChars={config.ai.maxInputChars}
            historyRounds={config.ai.contextualAdvisorHistoryRounds}
          />
        ) : null}

        {columns.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {columns.map((column) => {
              const latestDate = column.posts.length > 0
                ? new Date(column.posts[0].date)
                : null;

              return (
                <Link
                  key={column.slug}
                  href={`/health/${column.slug}`}
                  className="group flex flex-col rounded-xl border p-5 transition-all duration-200 hover:border-foreground/25 hover:shadow-sm"
                >
                  <div className="flex-1">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                      <span className="rounded-full bg-primary/10 p-1.5 text-primary">
                        {column.slug === "eat-your-way-to-health" ? (
                          <Utensils className="h-4 w-4" />
                        ) : column.slug === "drink-your-way-to-health" ? (
                          <GlassWater className="h-4 w-4" />
                        ) : column.slug === "diet-culture" ? (
                          <BookOpen className="h-4 w-4" />
                        ) : null}
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
            健康专栏文章还在准备中。
          </p>
        )}
      </div>
    </main>
  );
}
