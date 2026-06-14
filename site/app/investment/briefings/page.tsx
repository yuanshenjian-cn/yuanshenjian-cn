import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { generateListPageSEO } from "@/lib/seo-utils";
import { config } from "@/lib/config";
import { getAllInvestmentBriefings, getRecentInvestmentBriefings } from "@/lib/investment-briefings";
import { InvestmentBriefingsPageClient } from "@/components/investment/InvestmentBriefingsPageClient";

export const metadata: Metadata = generateListPageSEO(
  "投资简报",
  "最近 30 天的投资简报，以及按月份浏览更早历史归档。",
  `${config.site.url}/investment/briefings`,
);

export default async function InvestmentBriefingsPage() {
  const allBriefings = getAllInvestmentBriefings();
  const briefings = getRecentInvestmentBriefings(30);
  const totalBriefings = allBriefings.length;

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/investment" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回投资栏目
          </Link>
        </nav>

        <InvestmentBriefingsPageClient
          briefings={briefings}
          totalBriefings={totalBriefings}
          hasOlderBriefings={totalBriefings > 30}
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
