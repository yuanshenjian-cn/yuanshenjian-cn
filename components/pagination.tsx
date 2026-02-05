"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    // 总是显示第一页
    pages.push(1);

    // 当前页附近的页码
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    // 添加省略号
    if (start > 2) {
      pages.push("...");
    }

    // 添加中间页码
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 添加省略号
    if (end < totalPages - 1) {
      pages.push("...");
    }

    // 总是显示最后一页
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getVisiblePages();

  return (
    <nav className="flex items-center justify-center mt-12" aria-label="分页">
      {/* 桌面端：完整分页 */}
      <div className="hidden md:flex items-center gap-2">
        {/* 上一页 */}
        {currentPage > 1 ? (
          <Link
            href={currentPage === 2 ? "/articles" : `${baseUrl}/${currentPage - 1}`}
            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一页
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            上一页
          </span>
        )}

        {/* 页码 */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            <span key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
              ) : page === currentPage ? (
                <span className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md min-w-[36px] text-center">
                  {page}
                </span>
              ) : (
                <Link
                  href={page === 1 ? "/articles" : `${baseUrl}/${page}`}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors min-w-[36px] text-center"
                >
                  {page}
                </Link>
              )}
            </span>
          ))}
        </div>

        {/* 下一页 */}
        {currentPage < totalPages ? (
          <Link
            href={`${baseUrl}/${currentPage + 1}`}
            className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            下一页
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
            下一页
            <ChevronRight className="w-4 h-4" />
          </span>
        )}
      </div>

      {/* 移动端：简化分页 */}
      <div className="flex md:hidden items-center gap-4">
        {/* 上一页按钮 */}
        {currentPage > 1 ? (
          <Link
            href={currentPage === 2 ? "/articles" : `${baseUrl}/${currentPage - 1}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="上一页"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 cursor-not-allowed">
            <ChevronLeft className="w-5 h-5 text-muted-foreground/50" />
          </span>
        )}

        {/* 页码指示器 */}
        <div className="flex items-center gap-1 text-sm min-w-[80px] justify-center">
          <span className="font-medium text-foreground">{currentPage}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{totalPages}</span>
        </div>

        {/* 下一页按钮 */}
        {currentPage < totalPages ? (
          <Link
            href={`${baseUrl}/${currentPage + 1}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            aria-label="下一页"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 cursor-not-allowed">
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </span>
        )}
      </div>
    </nav>
  );
}
