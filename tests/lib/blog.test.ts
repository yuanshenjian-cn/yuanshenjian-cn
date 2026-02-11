import { describe, it, expect } from "vitest";
import { getPaginatedPosts, getPaginatedPostsByTag, getAllPosts } from "@/lib/blog";
import { POSTS_PER_PAGE } from "@/lib/config";

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
    const page1Slugs = new Set(page1.posts.map(p => p.slug));
    const page2Slugs = page2.posts.map(p => p.slug);
    
    const hasOverlap = page2Slugs.some(slug => page1Slugs.has(slug));
    expect(hasOverlap).toBe(false);
  });
});

describe("getPaginatedPostsByTag", () => {
  it("should return empty result for non-existent tag", () => {
    const result = getPaginatedPostsByTag("non-existent-tag-xyz", 1);
    expect(result.posts).toHaveLength(0);
    expect(result.totalPosts).toBe(0);
    // 当没有文章时，总页数为 0
    expect(result.totalPages).toBe(0);
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
    result.posts.forEach(post => {
      expect(post.tags).toContain(testTag);
    });

    // 总数应该一致
    const expectedCount = allPosts.filter(p => p.tags.includes(testTag)).length;
    expect(result.totalPosts).toBe(expectedCount);
  });
});
