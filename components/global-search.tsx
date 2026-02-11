"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { SearchPost } from "@/types/blog";

interface GlobalSearchProps {
  posts: SearchPost[];
}

export function GlobalSearch({ posts }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filteredPosts = posts.filter(
    (post) =>
      query === "" ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(query.toLowerCase())
  );

  const displayPosts = filteredPosts.slice(0, 5);
  const hasMore = filteredPosts.length > 5;

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          handleClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const maxIndex = hasMore ? displayPosts.length : displayPosts.length - 1;
            return prev >= maxIndex ? 0 : prev + 1;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            const maxIndex = hasMore ? displayPosts.length : displayPosts.length - 1;
            return prev <= 0 ? maxIndex : prev - 1;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (displayPosts.length > 0 && selectedIndex < displayPosts.length) {
            const post = displayPosts[selectedIndex];
            router.push(`/articles/${post.year}/${post.month}/${post.day}/${post.slug}`);
            handleClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, displayPosts, selectedIndex, hasMore, router, handleClose]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/50 rounded-md hover:text-foreground transition-colors"
        aria-label="打开搜索"
      >
        <Search className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">搜索</span>
        <kbd className="hidden md:inline px-1.5 py-0.5 text-xs bg-background rounded border">
          ⌘K
        </kbd>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="搜索文章"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <div className="w-full max-w-lg bg-card border rounded-lg shadow-lg overflow-hidden">
            <div className="border-b relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索文章..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-12 py-4 bg-transparent outline-none"
                aria-label="搜索输入"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
              />
              {query ? (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  aria-label="清除搜索"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  aria-label="关闭搜索"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="max-h-[50vh] overflow-y-auto" ref={resultsRef} id="search-results" role="listbox">
              {query && filteredPosts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm" role="status">
                  未找到相关文章
                </div>
              ) : (
                <div className="py-1">
                  {displayPosts.map((post, index) => {
                    const postUrl = `/articles/${post.year}/${post.month}/${post.day}/${post.slug}`;
                    return (
                      <a
                        key={post.slug}
                        href={postUrl}
                        role="option"
                        id={`search-result-${index}`}
                        aria-selected={selectedIndex === index}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(postUrl);
                          handleClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`block px-4 py-3 transition-colors ${
                          selectedIndex === index
                            ? "bg-muted"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div className="font-medium text-sm">{post.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {post.excerpt}
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>↑↓ 选择</span>
                <span>Enter 打开</span>
              </div>
              <span>ESC 关闭</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
