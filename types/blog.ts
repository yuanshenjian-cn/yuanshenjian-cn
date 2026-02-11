export interface Post {
  slug: string;
  year: string;
  month: string;
  day: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  readingTime: number;
  category?: string;
}

// 搜索用的轻量级文章类型（不包含完整content）
export interface SearchPost {
  slug: string;
  year: string;
  month: string;
  day: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface PostMetadata {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  published: boolean;
}

export interface PostFrontmatter {
  title?: string;
  date?: string;
  brief?: string;
  tags?: string | string[];
  published?: boolean;
}
