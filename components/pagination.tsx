"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /**
   * 分页模式
   * - 'link': 使用 Link 组件（用于 SEO，如全部文章列表）
   * - 'button': 使用 button 元素（用于客户端交互，如标签筛选）
   */
  mode: "link" | "button";
  /**
   * 分页样式变体
   * - 'full': 显示完整页码（桌面端）
   * - 'simple': 只显示上一页/下一页和当前页码（移动端）
   */
  variant?: "full" | "simple";
  /**
   * 基础 URL（用于 link 模式）
   * 例如：/articles/page
   */
  baseUrl?: string;
  /**
   * 页码变化回调（用于 button 模式）
   */
  onPageChange?: (page: number) => void;
}

/**
 * 分页组件
 * 支持链接模式和按钮模式，支持完整页码和简化显示
 */
export function Pagination({
  currentPage,
  totalPages,
  mode,
  variant = "full",
  baseUrl = "",
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // 获取可见页码（用于完整模式）
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = variant === "full" ? getVisiblePages() : [];

  // 上一页按钮/链接
  const PrevButton = () => {
    const isFirst = currentPage <= 1;
    const prevPage = currentPage - 1;
    const href = prevPage === 1 ? "/articles" : `${baseUrl}/${prevPage}`;

    if (mode === "link") {
      return isFirst ? (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          上一页
        </span>
      ) : (
        <Link
          href={href}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          上一页
        </Link>
      );
    }

    return (
      <button
        onClick={() => onPageChange?.(prevPage)}
        disabled={isFirst}
        className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
        上一页
      </button>
    );
  };

  // 下一页按钮/链接
  const NextButton = () => {
    const isLast = currentPage >= totalPages;
    const nextPage = currentPage + 1;

    if (mode === "link") {
      return isLast ? (
        <span className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed">
          下一页
          <ChevronRight className="w-4 h-4" />
        </span>
      ) : (
        <Link
          href={`${baseUrl}/${nextPage}`}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          下一页
          <ChevronRight className="w-4 h-4" />
        </Link>
      );
    }

    return (
      <button
        onClick={() => onPageChange?.(nextPage)}
        disabled={isLast}
        className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        下一页
        <ChevronRight className="w-4 h-4" />
      </button>
    );
  };

  // 页码显示（完整模式）
  const PageNumbers = () => (
    <div className="flex items-center gap-1">
      {pages.map((page, index) => (
        <span key={index}>
          {page === "..." ? (
            <span className="px-3 py-2 text-sm text-muted-foreground">...</span>
          ) : page === currentPage ? (
            <span className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md min-w-[36px] text-center">
              {page}
            </span>
          ) : mode === "link" ? (
            <Link
              href={page === 1 ? "/articles" : `${baseUrl}/${page}`}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors min-w-[36px] text-center"
            >
              {page}
            </Link>
          ) : (
            <button
              onClick={() => onPageChange?.(page as number)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors min-w-[36px] text-center"
            >
              {page}
            </button>
          )}
        </span>
      ))}
    </div>
  );

  // 简化模式的页码指示器
  const SimpleIndicator = () => (
    <div className="flex items-center gap-1 text-sm min-w-[80px] justify-center">
      <span className="font-medium text-foreground">{currentPage}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{totalPages}</span>
    </div>
  );

  // 移动端按钮（圆形）
  const MobilePrevButton = () => {
    const isFirst = currentPage <= 1;
    const prevPage = currentPage - 1;
    const href = prevPage === 1 ? "/articles" : `${baseUrl}/${prevPage}`;

    const className =
      "flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 transition-all disabled:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:active:scale-100";

    if (mode === "link") {
      return isFirst ? (
        <span className={`${className} cursor-not-allowed`}>
          <ChevronLeft className="w-5 h-5 text-muted-foreground/50" />
        </span>
      ) : (
        <Link href={href} className={className} aria-label="上一页">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      );
    }

    return (
      <button
        onClick={() => onPageChange?.(prevPage)}
        disabled={isFirst}
        className={className}
        aria-label="上一页"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
    );
  };

  const MobileNextButton = () => {
    const isLast = currentPage >= totalPages;
    const nextPage = currentPage + 1;

    const className =
      "flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 transition-all disabled:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:active:scale-100";

    if (mode === "link") {
      return isLast ? (
        <span className={`${className} cursor-not-allowed`}>
          <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
        </span>
      ) : (
        <Link href={`${baseUrl}/${nextPage}`} className={className} aria-label="下一页">
          <ChevronRight className="w-5 h-5" />
        </Link>
      );
    }

    return (
      <button
        onClick={() => onPageChange?.(nextPage)}
        disabled={isLast}
        className={className}
        aria-label="下一页"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    );
  };

  return (
    <nav className="flex items-center justify-center" aria-label="分页">
      {/* 桌面端：完整分页 */}
      <div className="hidden md:flex items-center gap-2">
        <PrevButton />
        {variant === "full" && <PageNumbers />}
        {variant === "simple" && <SimpleIndicator />}
        <NextButton />
      </div>

      {/* 移动端：简化分页 */}
      <div className="flex md:hidden items-center gap-4">
        <MobilePrevButton />
        <SimpleIndicator />
        <MobileNextButton />
      </div>
    </nav>
  );
}
