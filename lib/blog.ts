import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { Post, PostMetadata } from "@/types/blog";

const postsDirectory = path.join(process.cwd(), "content/blog");

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".mdx") || fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.mdx?$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      const wordCount = content.split(/\s+/g).length;
      const readingTime = Math.ceil(wordCount / 200);

      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || content.slice(0, 200) + "...",
        content,
        tags: data.tags || [],
        published: data.published !== false,
        readingTime,
      } as Post;
    });

  return allPostsData
    .filter((post) => post.published)
    .sort((a, b) => (new Date(b.date) > new Date(a.date) ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      const mdPath = path.join(postsDirectory, `${slug}.md`);
      if (!fs.existsSync(mdPath)) {
        return null;
      }
    }
    
    const filePath = fs.existsSync(fullPath) ? fullPath : path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    const wordCount = content.split(/\s+/g).length;
    const readingTime = Math.ceil(wordCount / 200);

    return {
      slug,
      title: data.title || slug,
      date: data.date || new Date().toISOString(),
      excerpt: data.excerpt || content.slice(0, 200) + "...",
      content,
      tags: data.tags || [],
      published: data.published !== false,
      readingTime,
    };
  } catch {
    return null;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}
