"use client";

import Link from "next/link";
import { Post } from "@/types/blog";
import { Calendar, Clock } from "lucide-react";
import { useState, useMemo } from "react";

interface BlogListProps {
  posts: Post[];
  tags: string[];
  initialTag: string | null;
}

export function BlogList({ posts, tags, initialTag }: BlogListProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);

  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((post) => post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  return (
    <>
      {/* Tags Filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              selectedTag === null
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            全部
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                selectedTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Results Count */}
      {selectedTag && (
        <div className="mb-6 text-sm text-muted-foreground">
          {filteredPosts.length} 篇文章
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">未找到文章</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
              <article key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("zh-CN")}
                      </time>
                    </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readingTime} 分钟
                  </span>
                </div>
                <h2 className="text-xl font-medium mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  {post.excerpt}
                </p>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(tag);
                        }}
                        className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))
        )}
      </div>
    </>
  );
}
