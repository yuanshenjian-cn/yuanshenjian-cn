import type { Post } from "@/types/blog";

export type InvestmentPriority = "core" | "important" | "event-driven";
export type InvestmentAreaType = "index" | "theme" | "sector" | "industry" | "style";
export type InvestmentMarket = "A股" | "港股" | "美股";

export interface InvestmentBriefingFrontmatter {
  title: string;
  date: string;
  brief: string;
  published: true;
  tags: string[];
}

export interface InvestmentBriefing extends InvestmentBriefingFrontmatter {
  slug: string;
  year: string;
  month: string;
  day: string;
  excerpt: string;
  content: string;
  readingTime: number;
  relativePath: string;
  url: string;
}

export interface InvestmentBriefingArchiveItem {
  year: string;
  month: string;
  count: number;
  startDate: string;
  endDate: string;
  url: string;
}

export interface InvestmentBriefingConfig {
  timezone: string;
  cadence: "cn-morning";
  normalBodyMin: number;
  normalBodyMax: number;
  shortBodyMin: number;
  disclaimer: string;
  coveragePageTitle: string;
  coveragePageIntro: string;
  methodCards: Array<{ title: string; description: string }>;
  boundaryStatements: string[];
}

export interface MarketWatchConfig {
  indices: string[];
  rates: string[];
  commodities: string[];
  macroCalendars: string[];
  enableMajorEventInsertion: boolean;
}

export interface InvestmentFocusArea {
  name: string;
  type: InvestmentAreaType;
  aliases: string[];
  priority: InvestmentPriority;
  mustCheck: boolean;
  focusPoints: string[];
  benchmarkSymbols: string[];
  leaderCompanies: string[];
  policySources: string[];
  dataSources: string[];
  eventSources: string[];
  triggers: string[];
  showOnCoveragePage: boolean;
  publicSummary: string;
  publicTags: string[];
  sortOrder: number;
}

export interface InvestmentFocusCompany {
  name: string;
  ticker: string;
  market: InvestmentMarket;
  aliases: string[];
  priority: InvestmentPriority;
  mustCheck: boolean;
  focusPoints: string[];
  officialSources: string[];
  irSources: string[];
  exchangeSources: string[];
  earningsSources: string[];
  triggers: string[];
  showOnCoveragePage: boolean;
  publicSummary: string;
  publicFocusPoints: string[];
  sortOrder: number;
}

export interface InvestmentToggles {
  enableConsensusExpectations: boolean;
  enableRumorWatch: boolean;
  enableMajorEventInsertion: boolean;
  enableCompanyDeepFocus: boolean;
}

export interface InvestmentCoverageAreaCard {
  name: string;
  type: InvestmentAreaType;
  priority: InvestmentPriority;
  publicSummary: string;
  publicTags: string[];
  sortOrder: number;
}

export interface InvestmentCoverageCompanyCard {
  name: string;
  ticker: string;
  market: InvestmentMarket;
  priority: InvestmentPriority;
  publicSummary: string;
  publicFocusPoints: string[];
  sortOrder: number;
}

export interface InvestmentCoverageData {
  title: string;
  intro: string;
  disclaimer: string;
  methodCards: Array<{ title: string; description: string }>;
  boundaryStatements: string[];
  areas: InvestmentCoverageAreaCard[];
  companies: InvestmentCoverageCompanyCard[];
}

export interface InvestmentColumnGuide {
  intro: string;
  paths?: Array<{ label: string; description: string }>;
}

export interface InvestmentColumnConfig {
  slug: string;
  title: string;
  description: string;
  contentDir: string;
  guide?: InvestmentColumnGuide;
}

export interface InvestmentColumnWithPosts extends InvestmentColumnConfig {
  posts: Post[];
}
