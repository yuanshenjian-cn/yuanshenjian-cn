import type { Metadata } from "next";
import { generateListPageSEO } from "@/lib/seo-utils";
import { config } from "@/lib/config";
import { getGeneratedInvestmentCoverageData } from "@/lib/investment-config";
import { getLatestInvestmentBriefing } from "@/lib/investment-briefings";
import { CoveragePageClient } from "@/components/investment/CoveragePageClient";

export const metadata: Metadata = generateListPageSEO(
  "投资观察范围",
  "公开说明这份投资简报主要覆盖什么、如何组织信息以及默认的风险边界。",
  `${config.site.url}/investment/coverage`,
);

export default async function InvestmentCoveragePage() {
  const coverage = getGeneratedInvestmentCoverageData();
  const latestBriefing = getLatestInvestmentBriefing();
  return <CoveragePageClient coverage={coverage} latestBriefingUrl={latestBriefing?.url ?? null} />;
}
