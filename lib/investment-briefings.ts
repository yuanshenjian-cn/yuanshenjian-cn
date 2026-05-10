import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
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

function getAllMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.md$/i.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

function parseTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
}

function buildExcerpt(brief: unknown, content: string): string {
  if (typeof brief === "string" && brief.trim().length > 0) {
    return brief.trim();
  }

  const cleaned = cleanContent(content);
  return cleaned.length > EXCERPT_LENGTH ? `${cleaned.slice(0, EXCERPT_LENGTH)}...` : cleaned;
}

function parseDateParts(date: string) {
  const [year = "", month = "", day = ""] = date.split("-");
  return { year, month, day };
}

function calculateReadingTime(content: string): number {
  const englishWords = content.match(/[a-zA-Z]+/g)?.length || 0;
  const chineseCharacters = content.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const readingTime = englishWords / config.readingTime.wordsPerMinute
    + chineseCharacters / config.readingTime.charactersPerMinute;

  return Math.max(1, Math.ceil(readingTime));
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

    const tags = parseTags(data.tags);
    const excerpt = buildExcerpt(data.brief, content);

    if (tags.length === 0 || excerpt.length === 0) {
      return null;
    }

    const slug = data.date;
    const dateParts = parseDateParts(data.date);

    return {
      slug,
      title: data.title,
      date: new Date(data.date).toISOString(),
      brief: data.brief,
      published: true,
      tags,
      excerpt,
      content,
      readingTime: calculateReadingTime(cleanContent(content)),
      relativePath: path.relative(investmentBriefingsDirectory, filePath).split(path.sep).join("/"),
      url: `/investment/daily-briefings/${slug}`,
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
    () => getAllMarkdownFiles(investmentBriefingsDirectory)
      .map(parseInvestmentBriefingFile)
      .filter((briefing): briefing is InvestmentBriefing => briefing !== null)
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
  );
}

export function getLatestInvestmentBriefing(): InvestmentBriefing | null {
  return getAllInvestmentBriefings()[0] ?? null;
}

export function getRecentInvestmentBriefings(limit: number): InvestmentBriefing[] {
  return getAllInvestmentBriefings().slice(0, limit);
}

export function getInvestmentBriefingBySlug(slug: string): InvestmentBriefing | null {
  return getAllInvestmentBriefings().find((briefing) => briefing.slug === slug) ?? null;
}

export function getInvestmentBriefingsByMonth(year: string, month: string): InvestmentBriefing[] {
  return getAllInvestmentBriefings().filter((briefing) => briefing.year === year && briefing.month === month);
}

export function getInvestmentBriefingArchives(): InvestmentBriefingArchiveItem[] {
  const archiveMap = new Map<string, InvestmentBriefingArchiveItem>();

  for (const briefing of getAllInvestmentBriefings()) {
    const key = `${briefing.year}-${briefing.month}`;
    const existing = archiveMap.get(key);

    if (!existing) {
      archiveMap.set(key, {
        year: briefing.year,
        month: briefing.month,
        count: 1,
        startDate: briefing.slug,
        endDate: briefing.slug,
        url: `/investment/daily-briefings/archive/${briefing.year}/${briefing.month}`,
      });
      continue;
    }

    existing.count += 1;
    existing.startDate = briefing.slug < existing.startDate ? briefing.slug : existing.startDate;
    existing.endDate = briefing.slug > existing.endDate ? briefing.slug : existing.endDate;
  }

  return Array.from(archiveMap.values()).sort((left, right) => `${right.year}-${right.month}`.localeCompare(`${left.year}-${left.month}`));
}

export function getAdjacentInvestmentBriefings(slug: string): { prev: InvestmentBriefing | null; next: InvestmentBriefing | null } {
  const briefings = getAllInvestmentBriefings();
  const currentIndex = briefings.findIndex((briefing) => briefing.slug === slug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: briefings[currentIndex + 1] ?? null,
    next: briefings[currentIndex - 1] ?? null,
  };
}
