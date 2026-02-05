import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post } from "@/types/blog";
import { config } from "@/lib/config";

export const POSTS_PER_PAGE = config.posts.perPage;

const postsDirectory = path.join(process.cwd(), "content/blog");

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function getRelativePath(fullPath: string): string {
  return path.relative(postsDirectory, fullPath);
}

function generateSlug(filePath: string): string {
  const fileName = path.basename(filePath);
  return fileName.replace(/\.mdx?$/i, "");
}

function parseDate(dateStr: string): { year: string; month: string; day: string } {
  const date = new Date(dateStr);
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return { year, month, day };
}

function parsePostFile(filePath: string): Post {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/[#*_`\[\]\(\)\{\}]/g, '')
    .replace(/\s+/g, '');
  
  const charCount = cleanContent.length;
  const readingTime = Math.max(1, Math.ceil(charCount / config.readingTime.charactersPerMinute));

  const slug = generateSlug(filePath);
  const dateObj = parseDate(data.date);
  const dateISO = data.date ? new Date(data.date).toISOString() : new Date().toISOString();

  const relativePath = getRelativePath(filePath);
  const pathParts = relativePath.split(/[\\/]/);
  const category = pathParts.length > 1 ? pathParts[0] : undefined;

  return {
    slug,
    year: dateObj.year,
    month: dateObj.month,
    day: dateObj.day,
    title: data.title || slug,
    date: dateISO,
    excerpt: data.brief || content.slice(0, 200).replace(/[#*_]/g, "") + "...",
    content,
    tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
    published: data.published !== false,
    readingTime,
    category,
  } as Post;
}

export function getAllPosts(): Post[] {
  const files = getAllMarkdownFiles(postsDirectory);

  const posts = files
    .map(parsePostFile)
    .filter((post) => post.published)
    .sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));

  return posts;
}


export function getPostByDateAndSlug(year: string, month: string, day: string, slug: string): Post | null {
  try {
    const decodedSlug = decodeURIComponent(slug);
    const files = getAllMarkdownFiles(postsDirectory);
    
    for (const filePath of files) {
      const fileSlug = generateSlug(filePath);
      const post = parsePostFile(filePath);
      
      if (fileSlug === decodedSlug && 
          post.year === year && 
          post.month === month && 
          post.day === day &&
          post.published) {
        return post;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    post.tags?.forEach((tag: string) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set<string>();
  posts.forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });
  return Array.from(categories).sort();
}

export function getAdjacentPosts(year: string, month: string, day: string, slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const currentIndex = posts.findIndex((post) => 
    post.slug === slug && 
    post.year === year && 
    post.month === month && 
    post.day === day
  );

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
    next: currentIndex > 0 ? posts[currentIndex - 1] : null,
  };
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((post) => post.category === category);
}

export interface PaginatedPosts {
  posts: Post[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
}

export function getPaginatedPosts(page: number, postsPerPage?: number): PaginatedPosts {
  const perPage = postsPerPage ?? POSTS_PER_PAGE;
  const allPosts = getAllPosts();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / perPage);

  // 确保页码在有效范围内
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (validPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  return {
    posts: allPosts.slice(startIndex, endIndex),
    totalPosts,
    totalPages,
    currentPage: validPage,
  };
}

// 获取标签相关的分页文章
export function getPaginatedPostsByTag(
  tag: string,
  page: number,
  postsPerPage?: number
): PaginatedPosts {
  const perPage = postsPerPage ?? POSTS_PER_PAGE;
  const allPosts = getAllPosts();
  const filteredPosts = allPosts.filter((post) => post.tags.includes(tag));
  const totalPosts = filteredPosts.length;
  const totalPages = Math.ceil(totalPosts / perPage);

  // 确保页码在有效范围内
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (validPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  return {
    posts: filteredPosts.slice(startIndex, endIndex),
    totalPosts,
    totalPages,
    currentPage: validPage,
  };
}
