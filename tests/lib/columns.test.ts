import { describe, it, expect, beforeEach } from "vitest";
import { getAIColumns, getAIColumnBySlug, getColumnContextByPost } from "@/lib/columns";
import { getAllPosts, getPostsByDirectory, clearPostsCache } from "@/lib/blog";

describe("Columns Module", () => {
  beforeEach(() => {
    clearPostsCache();
  });

  describe("getAIColumns", () => {
    it("should return non-empty array of columns with posts", () => {
      const columns = getAIColumns();
      expect(Array.isArray(columns)).toBe(true);
      expect(columns.length).toBeGreaterThan(0);
    });

    it("should not return columns with zero posts", () => {
      const columns = getAIColumns();
      columns.forEach((col) => {
        expect(col.posts.length).toBeGreaterThan(0);
      });
    });

    it("should include core AI columns", () => {
      const columns = getAIColumns();
      const slugs = columns.map((c) => c.slug);
      expect(slugs).toContain("claudecode");
      expect(slugs).toContain("opencode");
      expect(slugs).toContain("deepseek");
    });

    it("should have required fields on each column", () => {
      const columns = getAIColumns();
      columns.forEach((col) => {
        expect(col.slug).toBeDefined();
        expect(col.title).toBeDefined();
        expect(col.description).toBeDefined();
        expect(col.contentDir).toBeDefined();
        expect(Array.isArray(col.posts)).toBe(true);
      });
    });
  });

  describe("getAIColumnBySlug", () => {
    it("should return column for valid slug", () => {
      const column = getAIColumnBySlug("claudecode");
      expect(column).not.toBeNull();
      expect(column!.slug).toBe("claudecode");
      expect(column!.posts.length).toBeGreaterThan(0);
    });

    it("should return null for non-existent slug", () => {
      const column = getAIColumnBySlug("non-existent-slug");
      expect(column).toBeNull();
    });

    it("should return posts sorted by date descending (newest first)", () => {
      const column = getAIColumnBySlug("claudecode");
      if (!column || column.posts.length < 2) return;

      for (let i = 0; i < column.posts.length - 1; i++) {
        const currentDate = new Date(column.posts[i].date).getTime();
        const nextDate = new Date(column.posts[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });
  });

  describe("getColumnContextByPost", () => {
    it("should return context for a post belonging to a column", () => {
      const posts = getPostsByDirectory("swd/ai-coding/claudecode");
      if (posts.length === 0) return;

      const context = getColumnContextByPost(posts[0]);
      expect(context).not.toBeNull();
      expect(context!.column.slug).toBe("claudecode");
      expect(context!.currentIndex).toBe(0);
      expect(context!.totalPosts).toBe(posts.length);
    });

    it("should return null for a post not in any column", () => {
      const allPosts = getAllPosts();
      // 找一篇不在任何 AI 专栏目录下的文章，避免新增专栏时测试假设过期
      const nonColumnPost = allPosts.find((p) => !p.relativePath.startsWith("swd/ai-coding/"));
      if (!nonColumnPost) return;

      const context = getColumnContextByPost(nonColumnPost);
      expect(context).toBeNull();
    });

    it("should have null prev for first post in column", () => {
      const posts = getPostsByDirectory("swd/ai-coding/claudecode");
      if (posts.length === 0) return;

      const context = getColumnContextByPost(posts[0]);
      expect(context).not.toBeNull();
      expect(context!.prev).toBeNull();
      if (posts.length > 1) {
        expect(context!.next).not.toBeNull();
      }
    });

    it("should have null next for last post in column", () => {
      const posts = getPostsByDirectory("swd/ai-coding/claudecode");
      if (posts.length === 0) return;

      const lastPost = posts[posts.length - 1];
      const context = getColumnContextByPost(lastPost);
      expect(context).not.toBeNull();
      expect(context!.next).toBeNull();
      if (posts.length > 1) {
        expect(context!.prev).not.toBeNull();
      }
    });

    it("should return correct prev and next for middle post", () => {
      const posts = getPostsByDirectory("swd/ai-coding/claudecode");
      if (posts.length < 3) return;

      const middlePost = posts[1];
      const context = getColumnContextByPost(middlePost);
      expect(context).not.toBeNull();
      expect(context!.currentIndex).toBe(1);
      expect(context!.prev).not.toBeNull();
      expect(context!.prev!.slug).toBe(posts[0].slug);
      expect(context!.next).not.toBeNull();
      expect(context!.next!.slug).toBe(posts[2].slug);
    });
  });
});
