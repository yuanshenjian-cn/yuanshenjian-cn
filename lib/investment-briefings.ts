import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  buildBriefingExcerpt,
  buildMonthlyArchives,
  calculateBriefingReadingTime,
  getAdjacentItemsBySlug,
  getMarkdownFiles,
  getRecentItemsByDays,
  parseBriefingDateParts,
  parseBriefingTags,
} from "@/lib/briefing-core";
import { config } from "@/lib/config";
import { cleanContent } from "@/lib/utils";
import type {
  InvestmentBriefing,
  InvestmentBriefingArchiveItem,
  InvestmentBriefingFrontmatter,
} from "@/types/investment";

const EXCERPT_LENGTH = 180;
const investmentBriefingsDirectory = path.join(process.cwd(), "content", "investment-briefings");

let cachedBriefings: InvestmentBriefing[] | null = null;

function withCache<T>(getCached: () => T | null, setCached: (value: T) => void, calculate: () => T): T {
  const cached = getCached();
  if (cached !== null) {
    return cached;
  }

  const value = calculate();
  setCached(value);
  return value;
}

function normalizeInvestmentBriefingTitle(title: string): string {
  return title.replace(/^投资简报/, "投资简报");
}

function isValidFrontmatter(data: Partial<InvestmentBriefingFrontmatter>): data is InvestmentBriefingFrontmatter {
  return typeof data.title === "string"
    && typeof data.date === "string"
    && typeof data.brief === "string"
    && data.published === true;
}

function parseInvestmentBriefingFile(filePath: string): InvestmentBriefing | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (!isValidFrontmatter(data)) {
      console.warn(`[InvestmentBriefings] Skipping invalid briefing: ${path.relative(process.cwd(), filePath)}`);
      return null;
    }

    const tags = parseBriefingTags(data.tags);
    const excerpt = buildBriefingExcerpt(data.brief, content, EXCERPT_LENGTH);

    if (tags.length === 0 || excerpt.length === 0) {
      return null;
    }

    const slug = data.date;
    const dateParts = parseBriefingDateParts(data.date);

    return {
      slug,
      title: normalizeInvestmentBriefingTitle(data.title),
      date: new Date(data.date).toISOString(),
      brief: data.brief,
      published: true,
      tags,
      excerpt,
      content,
      readingTime: calculateBriefingReadingTime(cleanContent(content)),
      relativePath: path.relative(investmentBriefingsDirectory, filePath).split(path.sep).join("/"),
      url: `/investment/briefings/${slug}`,
      ...dateParts,
    };
  } catch (error) {
    console.error(`[InvestmentBriefings] Error parsing ${path.relative(process.cwd(), filePath)}:`, error);
    return null;
  }
}

export function clearInvestmentBriefingsCache() {
  cachedBriefings = null;
}

export function getAllInvestmentBriefings(): InvestmentBriefing[] {
  return withCache(
    () => cachedBriefings,
    (value) => {
      cachedBriefings = value;
    },
    () => getMarkdownFiles(investmentBriefingsDirectory, false)
      .map(parseInvestmentBriefingFile)
      .filter((briefing): briefing is InvestmentBriefing => briefing !== null)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
  );
}

export function getLatestInvestmentBriefing(): InvestmentBriefing | null {
  return getAllInvestmentBriefings()[0] ?? null;
}

export function getRecentInvestmentBriefings(days = 30, now = new Date()): InvestmentBriefing[] {
  return getRecentItemsByDays(getAllInvestmentBriefings(), days, now);
}

export function getInvestmentBriefingBySlug(slug: string): InvestmentBriefing | null {
  return getAllInvestmentBriefings().find((briefing) => briefing.slug === slug) ?? null;
}

export function getInvestmentBriefingsByMonth(year: string, month: string): InvestmentBriefing[] {
  return getAllInvestmentBriefings().filter((briefing) => briefing.year === year && briefing.month === month);
}

export function getInvestmentBriefingArchives(): InvestmentBriefingArchiveItem[] {
  return buildMonthlyArchives(getAllInvestmentBriefings(), (briefing) => `/investment/briefings/archive/${briefing.year}/${briefing.month}`);
}

export function getAdjacentInvestmentBriefings(slug: string): { prev: InvestmentBriefing | null; next: InvestmentBriefing | null } {
  return getAdjacentItemsBySlug(getAllInvestmentBriefings(), slug);
}
