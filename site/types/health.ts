import type { Post } from "@/types/blog";

export interface HealthColumnGuide {
  intro: string;
  paths?: Array<{ label: string; description: string }>;
}

export interface HealthColumnConfig {
  slug: string;
  title: string;
  description: string;
  contentDir: string;
  guide?: HealthColumnGuide;
}

export interface HealthColumnWithPosts extends HealthColumnConfig {
  posts: Post[];
}
