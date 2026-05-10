import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BriefingsPageClient } from "@/components/briefings/briefings-page-client";
import { getAllBriefings, getRecentBriefings } from "@/lib/briefings";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

export const metadata: Metadata = generateListPageSEO(
  "AI 每日简报",
  "每日追踪重点 AI 厂商动态，展示最近 30 天简报并支持按月份查看历史归档。",
  `${config.site.url}/ai/daily-briefings`,
);

export default async function BriefingsPage() {
  const briefings = getRecentBriefings(30);
  const totalBriefings = getAllBriefings().length;

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/ai" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回 AI 栏目
          </Link>
        </nav>

        <BriefingsPageClient
          briefings={briefings}
          totalBriefings={totalBriefings}
          aiConfig={{
            enabled: config.ai.enabled,
            workerUrl: config.ai.workerUrl,
            turnstileSiteKey: config.ai.turnstileSiteKey,
            turnstileTimeoutMs: config.ai.turnstile.timeoutMs.homepageRecommend,
            maxInputChars: config.ai.maxInputChars,
          }}
        />
      </div>
    </main>
  );
}
