import fs from "node:fs";
import path from "node:path";
import type {
  InvestmentBriefingConfig,
  InvestmentCoverageData,
  InvestmentFocusArea,
  InvestmentFocusCompany,
  InvestmentToggles,
  MarketWatchConfig,
} from "@/types/investment";
import { siteInvestmentDataDir, skillsDir } from "@/lib/workspace-paths";

const investmentConfigDirectory = path.join(skillsDir, "investment-briefing", "config");
const publicCoveragePath = path.join(siteInvestmentDataDir, "coverage.json");

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getInvestmentBriefingConfig(): InvestmentBriefingConfig {
  return readJsonFile<InvestmentBriefingConfig>(path.join(investmentConfigDirectory, "briefing.json"));
}

export function getInvestmentMarketWatchConfig(): MarketWatchConfig {
  return readJsonFile<MarketWatchConfig>(path.join(investmentConfigDirectory, "market-watch.json"));
}

export function getInvestmentFocusAreas(): InvestmentFocusArea[] {
  return readJsonFile<InvestmentFocusArea[]>(path.join(investmentConfigDirectory, "focus-areas.json"))
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getInvestmentFocusCompanies(): InvestmentFocusCompany[] {
  return readJsonFile<InvestmentFocusCompany[]>(path.join(investmentConfigDirectory, "focus-companies.json"))
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getInvestmentToggles(): InvestmentToggles {
  return readJsonFile<InvestmentToggles>(path.join(investmentConfigDirectory, "toggles.json"));
}

export function getInvestmentCoverageProjection(): InvestmentCoverageData {
  const briefing = getInvestmentBriefingConfig();
  const areas = getInvestmentFocusAreas()
    .filter((item) => item.showOnCoveragePage)
    .map(({ name, type, priority, publicSummary, publicTags, sortOrder }) => ({
      name,
      type,
      priority,
      publicSummary,
      publicTags,
      sortOrder,
    }));
  const companies = getInvestmentFocusCompanies()
    .filter((item) => item.showOnCoveragePage)
    .map(({ name, ticker, market, priority, publicSummary, publicFocusPoints, sortOrder }) => ({
      name,
      ticker,
      market,
      priority,
      publicSummary,
      publicFocusPoints,
      sortOrder,
    }));

  return {
    title: briefing.coveragePageTitle,
    intro: briefing.coveragePageIntro,
    disclaimer: briefing.disclaimer,
    methodCards: briefing.methodCards,
    boundaryStatements: briefing.boundaryStatements,
    areas,
    companies,
  };
}

export function getGeneratedInvestmentCoverageData(): InvestmentCoverageData {
  if (fs.existsSync(publicCoveragePath)) {
    return readJsonFile<InvestmentCoverageData>(publicCoveragePath);
  }

  return getInvestmentCoverageProjection();
}
