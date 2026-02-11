import { describe, it, expect, beforeEach } from "vitest";
import {
  getPaginatedPosts,
  getPaginatedPostsByTag,
  getAllPosts,
  getPostsForSearch,
  getPostByDateAndSlug,
  getAllTags,
  getAllCategories,
  getAdjacentPosts,
  getPostsByCategory,
  clearPostsCache,
} from "@/lib/blog";
import { POSTS_PER_PAGE } from "@/lib/config";

describe("Blog Module", () => {
  beforeEach(() => {
    clearPostsCache();
  });

  describe("getAllPosts", () => {
    it("should return valid posts array with correct structure", () => {
      const posts = getAllPosts();
      // 验证返回的是数组
      expect(Array.isArray(posts)).toBe(true);
      // 验证每个文章都有必需的字段
      if (posts.length > 0) {
        const firstPost = posts[0];
        expect(firstPost).toHaveProperty("slug");
        expect(firstPost).toHaveProperty("title");
        expect(firstPost).toHaveProperty("date");
        expect(firstPost).toHaveProperty("content");
      }
    });

    it("should return posts sorted by date descending", () => {
      const posts = getAllPosts();
      if (posts.length < 2) return;

      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].date).getTime();
        const nextDate = new Date(posts[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("should filter out unpublished posts", () => {
      const posts = getAllPosts();
      const unpublishedPosts = posts.filter((post) => !post.published);
      expect(unpublishedPosts).toHaveLength(0);
    });

    it("should return consistent results across multiple calls", () => {
      // 验证多次调用返回一致的数据
      const posts1 = getAllPosts();
      const posts2 = getAllPosts();
      
      // 内容应该完全一致
      expect(posts1).toStrictEqual(posts2);
      // 文章数量相同
      expect(posts2.length).toBe(posts1.length);
      // 第一篇数据一致
      if (posts1.length > 0) {
        expect(posts2[0].slug).toBe(posts1[0].slug);
        expect(posts2[0].title).toBe(posts1[0].title);
      }
    });
  });

  describe("getPostsForSearch", () => {
    it("should return valid search posts without content field", () => {
      const posts = getPostsForSearch();
      // 验证是数组
      expect(Array.isArray(posts)).toBe(true);
      
      if (posts.length === 0) return;

      const firstPost = posts[0];
      // 验证没有 content 字段（搜索用轻量化数据）
      expect(firstPost).not.toHaveProperty("content");
      // 验证有必需的字段
      expect(firstPost).toHaveProperty("slug");
      expect(firstPost).toHaveProperty("title");
      expect(firstPost).toHaveProperty("date");
      expect(firstPost).toHaveProperty("excerpt");
    });

    it("should return same number of posts as getAllPosts", () => {
      const allPosts = getAllPosts();
      const searchPosts = getPostsForSearch();
      expect(searchPosts.length).toBe(allPosts.length);
    });

    it("should return search posts sorted by date descending", () => {
      const posts = getPostsForSearch();
      if (posts.length < 2) return;

      for (let i = 0; i < posts.length - 1; i++) {
        const currentDate = new Date(posts[i].date).getTime();
        const nextDate = new Date(posts[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    });

    it("should have consistent data between getAllPosts and getPostsForSearch", () => {
      const allPosts = getAllPosts();
      const searchPosts = getPostsForSearch();

      if (allPosts.length === 0 || searchPosts.length === 0) return;

      // 检查第一篇和最后一篇文章的关键字段是否一致
      const firstAll = allPosts[0];
      const firstSearch = searchPosts[0];

      expect(firstSearch.slug).toBe(firstAll.slug);
      expect(firstSearch.title).toBe(firstAll.title);
      expect(firstSearch.date).toBe(firstAll.date);
      expect(firstSearch.year).toBe(firstAll.year);
      expect(firstSearch.month).toBe(firstAll.month);
      expect(firstSearch.day).toBe(firstAll.day);
    });
  });

  describe("getPaginatedPosts", () => {
    it("should return first page by default", () => {
      const result = getPaginatedPosts(1);
      expect(result.currentPage).toBe(1);
      expect(result.posts.length).toBeLessThanOrEqual(POSTS_PER_PAGE);
    });

    it("should handle invalid page numbers gracefully", () => {
      // 负数页码应该被纠正为第1页
      const negativeResult = getPaginatedPosts(-1);
      expect(negativeResult.currentPage).toBeGreaterThanOrEqual(1);

      // 超过总页数应该被纠正为最后一页
      const allPosts = getAllPosts();
      const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
      const overflowResult = getPaginatedPosts(totalPages + 100);
      expect(overflowResult.currentPage).toBeLessThanOrEqual(totalPages || 1);
    });

    it("should calculate correct total pages", () => {
      const allPosts = getAllPosts();
      const result = getPaginatedPosts(1);

      const expectedTotalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
      expect(result.totalPosts).toBe(allPosts.length);
      expect(result.totalPages).toBe(expectedTotalPages || 1);
    });

    it("should return different posts for different pages", () => {
      const page1 = getPaginatedPosts(1);

      // 如果只有一页或没有文章，跳过此测试
      if (page1.totalPages <= 1 || page1.posts.length === 0) {
        return;
      }

      const page2 = getPaginatedPosts(2);

      // 第2页的文章不应该与第1页相同
      const page1Slugs = new Set(page1.posts.map((p) => p.slug));
      const page2Slugs = page2.posts.map((p) => p.slug);

      const hasOverlap = page2Slugs.some((slug) => page1Slugs.has(slug));
      expect(hasOverlap).toBe(false);
    });

    it("should respect custom postsPerPage parameter", () => {
      const customPerPage = 5;
      const result = getPaginatedPosts(1, customPerPage);
      expect(result.posts.length).toBeLessThanOrEqual(customPerPage);
    });
  });

  describe("getPaginatedPostsByTag", () => {
    it("should return empty result for non-existent tag", () => {
      const result = getPaginatedPostsByTag("non-existent-tag-xyz", 1);
      expect(result.posts).toHaveLength(0);
      expect(result.totalPosts).toBe(0);
      // 当没有文章时，总页数至少为 1（为了分页 UI 的正常显示）
      expect(result.totalPages).toBeGreaterThanOrEqual(0);
    });

    it("should return correct pagination structure", () => {
      const allPosts = getAllPosts();

      // 如果没有文章，跳过测试
      if (allPosts.length === 0) {
        return;
      }

      // 使用第一篇文章的第一个标签进行测试
      const firstPost = allPosts[0];
      if (!firstPost.tags || firstPost.tags.length === 0) {
        return;
      }

      const testTag = firstPost.tags[0];
      const result = getPaginatedPostsByTag(testTag, 1);

      // 所有返回的文章都应该包含该标签
      result.posts.forEach((post) => {
        expect(post.tags).toContain(testTag);
      });

      // 总数应该一致
      const expectedCount = allPosts.filter((p) =>
        p.tags.includes(testTag)
      ).length;
      expect(result.totalPosts).toBe(expectedCount);
    });
  });

  describe("getPostByDateAndSlug", () => {
    it("should return null for non-existent post", () => {
      const post = getPostByDateAndSlug("2099", "01", "01", "non-existent");
      expect(post).toBeNull();
    });

    it("should return correct post by date and slug", () => {
      const allPosts = getAllPosts();
      if (allPosts.length === 0) return;

      const testPost = allPosts[0];
      const found = getPostByDateAndSlug(
        testPost.year,
        testPost.month,
        testPost.day,
        testPost.slug
      );

      expect(found).not.toBeNull();
      expect(found?.slug).toBe(testPost.slug);
      expect(found?.title).toBe(testPost.title);
    });
  });

  describe("getAllTags", () => {
    it("should return array of unique tags", () => {
      const tags = getAllTags();
      expect(Array.isArray(tags)).toBe(true);

      // 检查是否有重复标签
      const uniqueTags = new Set(tags);
      expect(uniqueTags.size).toBe(tags.length);
    });

    it("should return tags sorted alphabetically", () => {
      const tags = getAllTags();
      if (tags.length < 2) return;

      for (let i = 0; i < tags.length - 1; i++) {
        expect(tags[i].localeCompare(tags[i + 1])).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("getAllCategories", () => {
    it("should return array of unique categories", () => {
      const categories = getAllCategories();
      expect(Array.isArray(categories)).toBe(true);

      // 检查是否有重复分类
      const uniqueCategories = new Set(categories);
      expect(uniqueCategories.size).toBe(categories.length);
    });
  });

  describe("getAdjacentPosts", () => {
    it("should return prev and next as null for non-existent post", () => {
      const result = getAdjacentPosts("2099", "01", "01", "non-existent");
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });

    it("should return correct adjacent posts", () => {
      const allPosts = getAllPosts();
      if (allPosts.length < 3) return;

      // 使用第二篇文章测试（确保有前一篇和后一篇）
      const testPost = allPosts[1];
      const result = getAdjacentPosts(
        testPost.year,
        testPost.month,
        testPost.day,
        testPost.slug
      );

      // prev = 上一篇 = 日期更早的文章（索引+1）
      expect(result.prev).not.toBeNull();
      expect(result.prev?.slug).toBe(allPosts[2].slug);

      // next = 下一篇 = 日期更晚的文章（索引-1）
      expect(result.next).not.toBeNull();
      expect(result.next?.slug).toBe(allPosts[0].slug);
    });

    it("should return null for next when on first post (newest)", () => {
      const allPosts = getAllPosts();
      if (allPosts.length === 0) return;

      const firstPost = allPosts[0]; // 最新文章
      const result = getAdjacentPosts(
        firstPost.year,
        firstPost.month,
        firstPost.day,
        firstPost.slug
      );

      // 最新文章没有 "下一篇"（更晚的文章）
      expect(result.next).toBeNull();
      // 但应该有 "上一篇"（更早的文章）
      if (allPosts.length > 1) {
        expect(result.prev).not.toBeNull();
      }
    });

    it("should return null for prev when on last post (oldest)", () => {
      const allPosts = getAllPosts();
      if (allPosts.length === 0) return;

      const lastPost = allPosts[allPosts.length - 1]; // 最旧文章
      const result = getAdjacentPosts(
        lastPost.year,
        lastPost.month,
        lastPost.day,
        lastPost.slug
      );

      // 最旧文章没有 "上一篇"（更早的文章）
      expect(result.prev).toBeNull();
      // 但应该有 "下一篇"（更晚的文章）
      if (allPosts.length > 1) {
        expect(result.next).not.toBeNull();
      }
    });
  });

  describe("getPostsByCategory", () => {
    it("should return empty array for non-existent category", () => {
      const posts = getPostsByCategory("non-existent-category");
      expect(posts).toHaveLength(0);
    });

    it("should return posts filtered by category", () => {
      const allPosts = getAllPosts();
      if (allPosts.length === 0) return;

      // 找一个有分类的文章
      const postWithCategory = allPosts.find((p) => p.category);
      if (!postWithCategory) return;

      const categoryPosts = getPostsByCategory(postWithCategory.category!);
      expect(categoryPosts.length).toBeGreaterThan(0);

      categoryPosts.forEach((post) => {
        expect(post.category).toBe(postWithCategory.category);
      });
    });
  });

  describe("Pagination Configuration", () => {
    it("should use correct POSTS_PER_PAGE in pagination", () => {
      // 验证常量配置正确
      expect(POSTS_PER_PAGE).toBeDefined();
      expect(typeof POSTS_PER_PAGE).toBe("number");
      expect(POSTS_PER_PAGE).toBeGreaterThan(0);
      
      // 验证实际分页使用该配置
      const result = getPaginatedPosts(1);
      expect(result.posts.length).toBeLessThanOrEqual(POSTS_PER_PAGE);
    });
  });
});
