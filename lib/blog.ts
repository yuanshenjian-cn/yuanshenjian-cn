import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post, PostFrontmatter, SearchPost } from "@/types/blog";
import { PaginatedPosts } from "@/types/pagination";
import { config, POSTS_PER_PAGE, EXCERPT_LENGTH } from "@/lib/config";
import { cleanContent } from "@/lib/utils";

const postsDirectory = path.join(process.cwd(), "content/blog");
const isProduction = process.env.NODE_ENV === "production";

// 缓存文章数据（仅生产环境）
let cachedPosts: Post[] | null = null;
let cachedTags: string[] | null = null;
let cachedCategories: string[] | null = null;
let cachedSearchPosts: SearchPost[] | null = null;

/**
 * 生产环境缓存包装器：读写对称，dev 模式完全跳过缓存
 */
function withCache<T>(getCache: () => T | null, setCache: (v: T) => void, compute: () => T): T {
  if (!isProduction) return compute();
  const cached = getCache();
  if (cached !== null) return cached;
  const value = compute();
  setCache(value);
  return value;
}

/**
 * 递归获取指定目录下的所有 Markdown/MDX 文件
 */
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

/**
 * 生成文章摘要：优先 frontmatter.brief，否则截取正文
 */
function buildExcerpt(brief: string | undefined, content: string): string {
  if (brief) return brief;
  return content.slice(0, EXCERPT_LENGTH).replace(/[#*_]/g, "") + "...";
}

/**
 * 解析单个文章文件
 */
function parsePostFile(filePath: string): Post | null {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    const frontmatter = data as PostFrontmatter;

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
    const posixRelativePath = relativePath.split(path.sep).join("/");
    const pathParts = posixRelativePath.split("/");
    const category = pathParts.length > 1 ? pathParts[0] : undefined;

    return {
      slug,
      year: dateObj.year,
      month: dateObj.month,
      day: dateObj.day,
      title: frontmatter.title!,
      date: dateISO,
      excerpt: buildExcerpt(frontmatter.brief, content),
      content,
      tags: parseTags(frontmatter.tags),
      published: frontmatter.published !== false,
      readingTime,
      category,
      relativePath: posixRelativePath,
    };
  } catch (error) {
    console.error(`Error parsing post file ${filePath}:`, error);
    return null;
  }
}

/**
 * 获取所有已发布的文章，按日期降序排列
 */
export function getAllPosts(): Post[] {
  return withCache(
    () => cachedPosts,
    (v) => { cachedPosts = v; },
    () => getAllMarkdownFiles(postsDirectory)
      .map(parsePostFile)
      .filter((post): post is Post => post !== null && post.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  );
}

/**
 * 清除所有缓存（用于测试或开发环境重新加载）
 */
export function clearPostsCache(): void {
  cachedPosts = null;
  cachedTags = null;
  cachedCategories = null;
  cachedSearchPosts = null;
}

export function getPostByDateAndSlug(year: string, month: string, day: string, slug: string): Post | null {
  try {
    const decodedSlug = decodeURIComponent(slug);
    return getAllPosts().find(
      (post) =>
        post.slug === decodedSlug &&
        post.year === year &&
        post.month === month &&
        post.day === day,
    ) ?? null;
  } catch (error) {
    console.error(`[Blog] Failed to find post ${year}/${month}/${day}/${slug}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

export function getAllTags(): string[] {
  return withCache(
    () => cachedTags,
    (v) => { cachedTags = v; },
    () => {
      const tags = new Set<string>();
      getAllPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
      return Array.from(tags).sort((a, b) => a.localeCompare(b));
    },
  );
}

export function getAllCategories(): string[] {
  return withCache(
    () => cachedCategories,
    (v) => { cachedCategories = v; },
    () => {
      const categories = new Set<string>();
      getAllPosts().forEach((post) => {
        if (post.category) categories.add(post.category);
      });
      return Array.from(categories).sort();
    },
  );
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

function paginate(posts: Post[], page: number, postsPerPage?: number): PaginatedPosts {
  const perPage = postsPerPage ?? POSTS_PER_PAGE;
  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / perPage);

  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  const startIndex = (validPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  return {
    posts: posts.slice(startIndex, endIndex),
    totalPosts,
    totalPages,
    currentPage: validPage,
  };
}

export function getPaginatedPosts(page: number, postsPerPage?: number): PaginatedPosts {
  return paginate(getAllPosts(), page, postsPerPage);
}

export function getPaginatedPostsByTag(tag: string, page: number, postsPerPage?: number): PaginatedPosts {
  return paginate(
    getAllPosts().filter((post) => post.tags.includes(tag)),
    page,
    postsPerPage,
  );
}

/**
 * 获取用于搜索的轻量级文章列表（不含 content）
 */
export function getPostsForSearch(): SearchPost[] {
  return withCache(
    () => cachedSearchPosts,
    (v) => { cachedSearchPosts = v; },
    () => getAllPosts().map(({ slug, year, month, day, title, date, excerpt }) => ({
      slug, year, month, day, title, date, excerpt,
    })),
  );
}

/**
 * 按目录前缀过滤文章，按日期升序排列（用于专栏阅读顺序）
 * @param dir - 相对于 content/blog/ 的 POSIX 风格目录路径，例如 "swd/ai-coding/claudecode"
 */
export function getPostsByDirectory(dir: string): Post[] {
  const prefix = dir.endsWith("/") ? dir : `${dir}/`;
  return getAllPosts()
    .filter((post) => post.relativePath.startsWith(prefix))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
