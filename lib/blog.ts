import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post, PostFrontmatter, SearchPost } from "@/types/blog";
import { config } from "@/lib/config";
import { cleanContent } from "@/lib/utils";

export const POSTS_PER_PAGE = config.posts.perPage;

const postsDirectory = path.join(process.cwd(), "content/blog");

// 缓存文章数据
let cachedPosts: Post[] | null = null;
let cachedTags: string[] | null = null;
let cachedCategories: string[] | null = null;
let cachedSearchPosts: SearchPost[] | null = null;

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  try {
    if (!fs.existsSync(dir)) {
      console.warn(`[Blog] Posts directory not found: ${dir}`);
      return files;
    }

    const items = fs.readdirSync(dir);

    for (const item of items) {
      try {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...getAllMarkdownFiles(fullPath));
        } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
          files.push(fullPath);
        }
      } catch (itemError) {
        // 单个文件/目录读取失败不影响其他文件
        console.warn(`[Blog] Failed to read item "${item}" in ${dir}:`, itemError instanceof Error ? itemError.message : itemError);
      }
    }
  } catch (dirError) {
    console.error(`[Blog] Failed to read directory ${dir}:`, dirError instanceof Error ? dirError.message : dirError);
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

function parseTags(tags: string | string[] | undefined): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === "string");
  }
  if (typeof tags === "string") {
    return [tags];
  }
  return [];
}

function validateFrontmatter(data: PostFrontmatter, filePath: string): { isValid: boolean; error?: string } {
  if (!data.title) {
    return { isValid: false, error: `Missing required field "title" in ${filePath}` };
  }
  if (!data.date) {
    return { isValid: false, error: `Missing required field "date" in ${filePath}` };
  }
  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: `Invalid date format "${data.date}" in ${filePath}` };
  }
  return { isValid: true };
}

function parsePostFile(filePath: string): Post | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    const frontmatter = data as PostFrontmatter;

    // 验证 frontmatter
    const validation = validateFrontmatter(frontmatter, filePath);
    if (!validation.isValid) {
      console.warn(validation.error);
      return null;
    }

    const cleanText = cleanContent(content);
    const charCount = cleanText.length;
    const readingTime = Math.max(1, Math.ceil(charCount / config.readingTime.charactersPerMinute));

    const slug = generateSlug(filePath);
    const dateObj = parseDate(frontmatter.date!);
    const dateISO = new Date(frontmatter.date!).toISOString();

    const relativePath = getRelativePath(filePath);
    const pathParts = relativePath.split(/[\\/]/);
    const category = pathParts.length > 1 ? pathParts[0] : undefined;

    const excerpt = frontmatter.brief || content.slice(0, 200).replace(/[#*_]/g, "") + "...";

    return {
      slug,
      year: dateObj.year,
      month: dateObj.month,
      day: dateObj.day,
      title: frontmatter.title!,
      date: dateISO,
      excerpt,
      content,
      tags: parseTags(frontmatter.tags),
      published: frontmatter.published !== false,
      readingTime,
      category,
    };
  } catch (error) {
    console.error(`Error parsing post file ${filePath}:`, error);
    return null;
  }
}

export function getAllPosts(): Post[] {
  // 生产构建时使用缓存，开发模式禁用以保证实时更新
  if (cachedPosts && process.env.NODE_ENV === 'production') {
    return cachedPosts;
  }

  const files = getAllMarkdownFiles(postsDirectory);

  const posts = files
    .map(parsePostFile)
    .filter((post): post is Post => post !== null && post.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 缓存结果
  cachedPosts = posts;
  return posts;
}

// 清除缓存（用于开发环境重新加载）
export function clearPostsCache(): void {
  cachedPosts = null;
  cachedTags = null;
  cachedCategories = null;
  cachedSearchPosts = null;
}


export function getPostByDateAndSlug(year: string, month: string, day: string, slug: string): Post | null {
  try {
    const decodedSlug = decodeURIComponent(slug);
    const files = getAllMarkdownFiles(postsDirectory);
    
    for (const filePath of files) {
      try {
        const fileSlug = generateSlug(filePath);
        const post = parsePostFile(filePath);
        
        if (post && 
            fileSlug === decodedSlug && 
            post.year === year && 
            post.month === month && 
            post.day === day &&
            post.published) {
          return post;
        }
      } catch (fileError) {
        // 单个文件解析失败不影响其他文件
        console.warn(`[Blog] Failed to parse file while searching: ${filePath}`, fileError instanceof Error ? fileError.message : fileError);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[Blog] Failed to find post ${year}/${month}/${day}/${slug}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export function getAllTags(): string[] {
  // 生产构建时使用缓存，开发模式禁用以保证实时更新
  if (cachedTags && process.env.NODE_ENV === 'production') {
    return cachedTags;
  }

  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag: string) => tags.add(tag));
  });

  const sortedTags = Array.from(tags).sort();
  cachedTags = sortedTags;
  return sortedTags;
}

export function getAllCategories(): string[] {
  // 生产构建时使用缓存，开发模式禁用以保证实时更新
  if (cachedCategories && process.env.NODE_ENV === 'production') {
    return cachedCategories;
  }

  const posts = getAllPosts();
  const categories = new Set<string>();
  posts.forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });

  const sortedCategories = Array.from(categories).sort();
  cachedCategories = sortedCategories;
  return sortedCategories;
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

// 获取用于搜索的文章列表（轻量级，不包含完整content）
export function getPostsForSearch(): SearchPost[] {
  // 生产构建时使用缓存，开发模式禁用以保证实时更新
  if (cachedSearchPosts && process.env.NODE_ENV === 'production') {
    return cachedSearchPosts;
  }

  const files = getAllMarkdownFiles(postsDirectory);

  const posts = files
    .map((filePath): SearchPost | null => {
      try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        const frontmatter = data as PostFrontmatter;

        // 验证必需的frontmatter字段
        if (!frontmatter.title || !frontmatter.date) {
          return null;
        }

        const dateObj = parseDate(frontmatter.date);
        const dateISO = new Date(frontmatter.date).toISOString();
        const slug = generateSlug(filePath);
        const excerpt = frontmatter.brief || content.slice(0, 200).replace(/[#*_]/g, '') + '...';

        // 检查文章是否已发布
        const published = frontmatter.published !== false;
        if (!published) {
          return null;
        }

        return {
          slug,
          year: dateObj.year,
          month: dateObj.month,
          day: dateObj.day,
          title: frontmatter.title,
          date: dateISO,
          excerpt,
        };
      } catch (error) {
        console.warn(`[Blog] Failed to parse file for search: ${filePath}`, error instanceof Error ? error.message : error);
        return null;
      }
    })
    .filter((post): post is SearchPost => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 缓存结果
  cachedSearchPosts = posts;
  return posts;
}
