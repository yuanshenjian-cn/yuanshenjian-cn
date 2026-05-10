import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Briefing, BriefingFrontmatter, BriefingRecommendationRange } from "@/types/briefing";
import { config, EXCERPT_LENGTH } from "@/lib/config";
import { cleanContent } from "@/lib/utils";

const briefingsDirectory = path.join(process.cwd(), "content/ai-briefings");
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

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
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

function parseDate(date: string) {
  const [year = "", month = "", day = ""] = date.split("-");
  return {
    year,
    month,
    day,
  };
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = config.readingTime.wordsPerMinute;
  const charactersPerMinute = config.readingTime.charactersPerMinute;
  const englishWords = content.match(/[a-zA-Z]+/g)?.length || 0;
  const chineseCharacters = content.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const readingTime = englishWords / wordsPerMinute + chineseCharacters / charactersPerMinute;

  return Math.max(1, Math.ceil(readingTime));
}

function isValidFrontmatter(data: Partial<BriefingFrontmatter>): data is BriefingFrontmatter {
  return typeof data.title === "string" && typeof data.date === "string";
}

function parseBriefingFile(filePath: string): Briefing | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    if (!isValidFrontmatter(data)) {
      console.warn(`[Briefings] Skipping invalid briefing: ${path.relative(process.cwd(), filePath)}`);
      return null;
    }

    const published = data.published === true;
    const tags = parseTags(data.tags);
    const excerpt = buildExcerpt(data.brief, content);

    if (!published || tags.length === 0 || excerpt.length === 0) {
      return null;
    }

    const slug = data.date;
    const dateParts = parseDate(data.date);

    return {
      slug,
      title: data.title,
      date: new Date(data.date).toISOString(),
      ...dateParts,
      excerpt,
      tags,
      published,
      content,
      readingTime: calculateReadingTime(cleanContent(content)),
      relativePath: path.relative(briefingsDirectory, filePath).split(path.sep).join("/"),
      url: `/ai/daily-briefings/${slug}`,
    };
  } catch (error) {
    console.error(`[Briefings] Error parsing ${path.relative(process.cwd(), filePath)}:`, error);
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
      getAllMarkdownFiles(briefingsDirectory)
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
  const briefings = getAllBriefings();
  const index = briefings.findIndex((briefing) => briefing.slug === slug);

  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: briefings[index + 1] ?? null,
    next: briefings[index - 1] ?? null,
  };
}

export function getBriefingsByRange(range: BriefingRecommendationRange, now = new Date()): Briefing[] {
  const days = range === "today" ? 1 : Number.parseInt(range.replace("d", ""), 10);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return getAllBriefings().filter((briefing) => new Date(briefing.date).getTime() >= start.getTime());
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
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return getAllBriefings().filter((briefing) => new Date(briefing.date).getTime() >= start.getTime());
}

export function getBriefingArchives(): BriefingArchiveItem[] {
  const archiveMap = new Map<string, BriefingArchiveItem>();

  for (const briefing of getAllBriefings()) {
    const key = `${briefing.year}-${briefing.month}`;
    const existing = archiveMap.get(key);

    if (!existing) {
      archiveMap.set(key, {
        year: briefing.year,
        month: briefing.month,
        count: 1,
        startDate: briefing.slug,
        endDate: briefing.slug,
        url: `/ai/daily-briefings/archive/${briefing.year}/${briefing.month}`,
      });
      continue;
    }

    existing.count += 1;
    existing.startDate = briefing.slug < existing.startDate ? briefing.slug : existing.startDate;
    existing.endDate = briefing.slug > existing.endDate ? briefing.slug : existing.endDate;
  }

  return Array.from(archiveMap.values()).sort((left, right) => {
    const leftKey = `${left.year}-${left.month}`;
    const rightKey = `${right.year}-${right.month}`;
    return rightKey.localeCompare(leftKey);
  });
}

export function getBriefingsByMonth(year: string, month: string): Briefing[] {
  return getAllBriefings().filter((briefing) => briefing.year === year && briefing.month === month);
}
