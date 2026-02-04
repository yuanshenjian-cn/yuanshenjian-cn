export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
  readingTime?: number;
  category?: string;
}

export interface PostMetadata {
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  published: boolean;
}
