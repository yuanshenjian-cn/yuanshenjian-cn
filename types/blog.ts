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
