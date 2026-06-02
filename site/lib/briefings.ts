import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Briefing, BriefingFrontmatter, BriefingRecommendationRange } from "@/types/briefing";
import { EXCERPT_LENGTH } from "@/lib/config";
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
import { cleanContent } from "@/lib/utils";
import { aiBriefingsDir, repoRoot } from "@/lib/workspace-paths";

const briefingsDirectory = aiBriefingsDir;
const isProduction = process.env.NODE_ENV === "production";

let cachedBriefings: Briefing[] | null = null;

function withCache<T>(getCache: () => T | null, setCache: (value: T) => void, compute: () => T): T {
  if (!isProduction) return compute();

  const cached = getCache();
  if (cached !== null) return cached;

  const value = compute();
  setCache(value);
  return value;
}

function normalizeBriefingTitle(title: string): string {
  return title.replace(/^AI\s+每日简报/, "AI 简报");
}

function isValidFrontmatter(data: Partial<BriefingFrontmatter>): data is BriefingFrontmatter {
  return typeof data.title === "string" && typeof data.date === "string";
}

function parseBriefingFile(filePath: string): Briefing | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (!isValidFrontmatter(data)) {
      console.warn(`[Briefings] Skipping invalid briefing: ${path.relative(repoRoot, filePath)}`);
      return null;
    }

    const published = data.published === true;
    const tags = parseBriefingTags(data.tags);
    const excerpt = buildBriefingExcerpt(data.brief, content, EXCERPT_LENGTH);

    if (!published || tags.length === 0 || excerpt.length === 0) {
      return null;
    }

    const slug = data.date;
    const dateParts = parseBriefingDateParts(data.date);

    return {
      slug,
      title: normalizeBriefingTitle(data.title),
      date: new Date(data.date).toISOString(),
      ...dateParts,
      excerpt,
      tags,
      published,
      content,
      readingTime: calculateBriefingReadingTime(cleanContent(content)),
      relativePath: path.relative(briefingsDirectory, filePath).split(path.sep).join("/"),
      url: `/ai/briefings/${slug}`,
    };
  } catch (error) {
    console.error(`[Briefings] Error parsing ${path.relative(repoRoot, filePath)}:`, error);
    return null;
  }
}

export function clearBriefingsCache() {
  cachedBriefings = null;
}

export function getAllBriefings(): Briefing[] {
  return withCache(
    () => cachedBriefings,
    (value) => {
      cachedBriefings = value;
    },
    () =>
      getMarkdownFiles(briefingsDirectory)
        .map(parseBriefingFile)
        .filter((briefing): briefing is Briefing => briefing !== null)
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime()),
  );
}

export function getLatestBriefing(): Briefing | null {
  return getAllBriefings()[0] ?? null;
}

export function getBriefingBySlug(slug: string): Briefing | null {
  return getAllBriefings().find((briefing) => briefing.slug === slug) ?? null;
}

export function getAdjacentBriefings(slug: string): { prev: Briefing | null; next: Briefing | null } {
  return getAdjacentItemsBySlug(getAllBriefings(), slug);
}

export function getBriefingsByRange(range: BriefingRecommendationRange, now = new Date()): Briefing[] {
  const days = range === "today" ? 1 : Number.parseInt(range.replace("d", ""), 10);
  return getRecentItemsByDays(getAllBriefings(), days, now);
}

export interface BriefingArchiveItem {
  year: string;
  month: string;
  count: number;
  startDate: string;
  endDate: string;
  url: string;
}

export function getRecentBriefings(days = 30, now = new Date()): Briefing[] {
  return getRecentItemsByDays(getAllBriefings(), days, now);
}

export function getBriefingArchives(): BriefingArchiveItem[] {
  return buildMonthlyArchives(getAllBriefings(), (briefing) => `/ai/briefings/archive/${briefing.year}/${briefing.month}`);
}

export function getBriefingsByMonth(year: string, month: string): Briefing[] {
  return getAllBriefings().filter((briefing) => briefing.year === year && briefing.month === month);
}
