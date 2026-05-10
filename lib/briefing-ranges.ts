import type { BriefingRecommendationRange } from "@/types/briefing";

export const BRIEFING_RANGE_LABELS: Record<BriefingRecommendationRange, string> = {
  today: "今天",
  "3d": "近 3 天",
  "7d": "近 1 周",
  "14d": "近 2 周",
  "30d": "近 30 天",
};

export const BRIEFING_FILTER_OPTIONS: Array<{ value: Exclude<BriefingRecommendationRange, "today">; label: string }> = [
  { value: "3d", label: BRIEFING_RANGE_LABELS["3d"] },
  { value: "7d", label: BRIEFING_RANGE_LABELS["7d"] },
  { value: "14d", label: BRIEFING_RANGE_LABELS["14d"] },
  { value: "30d", label: BRIEFING_RANGE_LABELS["30d"] },
];

export function getBriefingRangeLabel(range: BriefingRecommendationRange): string {
  return BRIEFING_RANGE_LABELS[range];
}

export function isBriefingInRange(date: string, range: BriefingRecommendationRange, now = new Date()): boolean {
  const days = range === "today" ? 1 : Number.parseInt(range.replace("d", ""), 10);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return new Date(date).getTime() >= start.getTime();
}
