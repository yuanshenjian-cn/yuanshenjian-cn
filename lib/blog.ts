import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post } from "@/types/blog";

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
  // 只使用文件名作为 slug，去掉目录前缀
  const fileName = path.basename(filePath);
  return fileName.replace(/\.mdx?$/i, "");
}

function parsePostFile(filePath: string): Post {
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // 计算阅读时间：中文按字符数，英文按单词数
  // 移除 markdown 标记、空格和换行符后统计
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/`[^`]+`/g, '')         // 移除行内代码
    .replace(/[#*_`\[\]\(\)\{\}]/g, '') // 移除 markdown 标记
    .replace(/\s+/g, '');            // 移除所有空白
  
  const charCount = cleanContent.length;
  // 中文阅读速度约 600 字/分钟
  const readingTime = Math.max(1, Math.ceil(charCount / 600));

  const slug = generateSlug(filePath);

  // 从文件路径提取分类
  const relativePath = getRelativePath(filePath);
  const pathParts = relativePath.split(/[\\/]/);
  const category = pathParts.length > 1 ? pathParts[0] : undefined;

  return {
    slug,
    title: data.title || slug,
    date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
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

function findFileBySlug(slug: string, dir: string): string | null {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const result = findFileBySlug(slug, fullPath);
      if (result) return result;
    } else if (item.endsWith(".mdx") || item.endsWith(".md")) {
      const itemSlug = item.replace(/\.mdx?$/, "");
      // 只检查文件名是否匹配
      if (itemSlug === slug) {
        return fullPath;
      }
    }
  }
  
  return null;
}

export function getPostBySlug(slug: string): Post | null {
  try {
    // 在子目录中递归查找文件
    const filePath = findFileBySlug(slug, postsDirectory);
    
    if (!filePath) {
      // 回退：直接尝试拼接路径
      const directPath = path.join(postsDirectory, `${slug}.mdx`);
      if (fs.existsSync(directPath)) {
        return parsePostFile(directPath);
      }
      const mdPath = path.join(postsDirectory, `${slug}.md`);
      if (fs.existsSync(mdPath)) {
        return parsePostFile(mdPath);
      }
      return null;
    }

    return parsePostFile(filePath);
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

export function getAdjacentPosts(slug: string): { prev: Post | null; next: Post | null } {
  const posts = getAllPosts();
  const currentIndex = posts.findIndex((post) => post.slug === slug);

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
