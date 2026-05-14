import fs from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";
import { cleanContent } from "@/lib/utils";

export interface BriefingDateParts {
  year: string;
  month: string;
  day: string;
}

export interface BriefingArchiveRecord {
  year: string;
  month: string;
  count: number;
  startDate: string;
  endDate: string;
  url: string;
}

export function getMarkdownFiles(dir: string, recursive = true): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...getMarkdownFiles(fullPath, recursive));
      }
      continue;
    }

    if (entry.isFile() && /\.md$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

export function parseBriefingTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0);
}

export function buildBriefingExcerpt(brief: unknown, content: string, excerptLength: number): string {
  if (typeof brief === "string" && brief.trim().length > 0) {
    return brief.trim();
  }

  const cleaned = cleanContent(content);
  return cleaned.length > excerptLength ? `${cleaned.slice(0, excerptLength)}...` : cleaned;
}

export function parseBriefingDateParts(date: string): BriefingDateParts {
  const [year = "", month = "", day = ""] = date.split("-");
  return { year, month, day };
}

export function calculateBriefingReadingTime(content: string): number {
  const englishWords = content.match(/[a-zA-Z]+/g)?.length || 0;
  const chineseCharacters = content.match(/[\u4e00-\u9fff]/g)?.length || 0;
  const readingTime = englishWords / config.readingTime.wordsPerMinute
    + chineseCharacters / config.readingTime.charactersPerMinute;

  return Math.max(1, Math.ceil(readingTime));
}

export function sortByDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
}

export function getRecentItemsByDays<T extends { date: string }>(items: T[], days = 30, now = new Date()): T[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return items.filter((item) => new Date(item.date).getTime() >= start.getTime());
}

export function getAdjacentItemsBySlug<T extends { slug: string }>(items: T[], slug: string): { prev: T | null; next: T | null } {
  const index = items.findIndex((item) => item.slug === slug);
  if (index === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: items[index + 1] ?? null,
    next: items[index - 1] ?? null,
  };
}

export function buildMonthlyArchives<T extends { year: string; month: string; slug: string }>(
  items: T[],
  getUrl: (item: T) => string,
): BriefingArchiveRecord[] {
  const archiveMap = new Map<string, BriefingArchiveRecord>();

  for (const item of items) {
    const key = `${item.year}-${item.month}`;
    const existing = archiveMap.get(key);

    if (!existing) {
      archiveMap.set(key, {
        year: item.year,
        month: item.month,
        count: 1,
        startDate: item.slug,
        endDate: item.slug,
        url: getUrl(item),
      });
      continue;
    }

    existing.count += 1;
    existing.startDate = item.slug < existing.startDate ? item.slug : existing.startDate;
    existing.endDate = item.slug > existing.endDate ? item.slug : existing.endDate;
  }

  return Array.from(archiveMap.values()).sort((left, right) => `${right.year}-${right.month}`.localeCompare(`${left.year}-${left.month}`));
}
