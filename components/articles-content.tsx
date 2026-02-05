"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Post } from "@/types/blog";
import { Pagination } from "./pagination";
import { PaginationNav } from "./pagination-nav";
import { Calendar, Clock, Rss } from "lucide-react";

interface ArticlesContentProps {
  allPosts: Post[];
  tags: string[];
  postsPerPage: number;
  initialPage?: number;
}

export function ArticlesContent({ 
  allPosts, 
  tags, 
  postsPerPage,
  initialPage = 1,
}: ArticlesContentProps) {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get("tag");
  const [selectedTag, setSelectedTag] = useState<string | null>(tagFromUrl);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // 筛选文章
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return allPosts;
    return allPosts.filter((post) => post.tags.includes(selectedTag));
  }, [allPosts, selectedTag]);

  // 计算分页
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  
  // 确保当前页在有效范围内
  const validPage = Math.min(currentPage, Math.max(1, totalPages));
  
  const paginatedPosts = useMemo(() => {
    const startIndex = (validPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, validPage, postsPerPage]);

  // 处理标签点击
  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1); // 重置到第一页
    
    // 更新 URL
    if (tag) {
      const encodedTag = encodeURIComponent(tag);
      window.history.pushState({}, "", `/articles?tag=${encodedTag}`);
    } else {
      window.history.pushState({}, "", "/articles");
    }
  };

  // 处理分页点击
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: "smooth" });
    
    // 更新 URL（如果是标签筛选模式）
    if (selectedTag) {
      const url = `/articles?tag=${encodeURIComponent(selectedTag)}&page=${page}`;
      window.history.pushState({}, "", url);
    }
  };

  return (
    <>
      {/* 标题区域 - 高级简约风格 */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-3 text-foreground">
            {selectedTag ? selectedTag : "全部文章"}
          </h1>
          <p className="text-sm text-foreground/60 font-light">
            {selectedTag ? (
              <>
                共 {filteredPosts.length} 篇相关文章
                {totalPages > 1 && ` · 第 ${validPage}/${totalPages} 页`}
              </>
            ) : (
              <>
                {allPosts.length} 篇文章 · {tags.length} 个标签
                {totalPages > 1 && ` · 第 ${validPage}/${totalPages} 页`}
              </>
            )}
          </p>
        </div>
        {!selectedTag && (
          <Link
            href="/feed"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-foreground/60 hover:text-foreground border border-border/50 hover:border-foreground/30 rounded-full transition-all"
            aria-label="RSS 订阅"
          >
            <Rss className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">订阅</span>
          </Link>
        )}
      </div>

      {/* 标签筛选 - 简约风格 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-10">
          <button
            onClick={() => handleTagClick(null)}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
              selectedTag === null
                ? "bg-foreground text-background font-medium"
                : "bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground"
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                selectedTag === tag
                  ? "bg-foreground text-background font-medium"
                  : "bg-muted/50 text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 文章列表 */}
      <div className="space-y-16">
        {paginatedPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">
              {selectedTag ? `没有找到标签「${selectedTag}」的文章` : "暂无文章"}
            </p>
          </div>
        ) : (
          paginatedPosts.map((post) => (
            <article key={post.slug}>
              <Link 
                href={`/articles/${post.year}/${post.month}/${post.day}/${post.slug}`} 
                className="group block"
              >
                <h2 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("zh-CN")}
                    </time>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readingTime} 分钟
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTagClick(t);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          t === selectedTag
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-primary hover:text-primary-foreground"
                        }`}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="mt-12">
          {selectedTag ? (
            // 标签筛选模式：客户端分页
            <PaginationNav
              currentPage={validPage}
              totalPages={totalPages}
              mode="button"
              onPageChange={handlePageChange}
            />
          ) : (
            // 全部文章模式：链接分页（支持 SEO）
            <Pagination
              currentPage={validPage}
              totalPages={totalPages}
              baseUrl="/articles/page"
            />
          )}
        </div>
      )}
    </>
  );
}
