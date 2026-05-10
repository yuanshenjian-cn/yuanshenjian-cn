export type BriefingRecommendationRange = "today" | "3d" | "7d" | "14d" | "30d";

export interface BriefingFrontmatter {
  title: string;
  date: string;
  brief?: string;
  tags?: string[];
  published?: boolean;
}

export interface Briefing {
  slug: string;
  title: string;
  date: string;
  year: string;
  month: string;
  day: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  content: string;
  readingTime: number;
  relativePath: string;
  url: string;
}
