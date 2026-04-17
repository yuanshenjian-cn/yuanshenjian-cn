"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Mode = "link" | "button";
type Direction = "prev" | "next";
type Style = "desktop" | "mobile";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /**
   * 分页模式
   * - 'link': 使用 Link 组件（用于 SEO，如全部文章列表）
   * - 'button': 使用 button 元素（用于客户端交互，如标签筛选）
   */
  mode: Mode;
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

const DESKTOP_NAV_CLASS =
  "flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const DESKTOP_NAV_DISABLED_CLASS =
  "flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground/50 cursor-not-allowed";
const MOBILE_NAV_CLASS =
  "flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 transition-all disabled:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:active:scale-100";

/**
 * 计算页码对应的链接地址（page=1 回到 /articles）
 */
function pageHref(baseUrl: string, page: number): string {
  return page === 1 ? "/articles" : `${baseUrl}/${page}`;
}

/**
 * 生成可见页码列表，包含省略号
 */
function getVisiblePages(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [1];

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push("...");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

interface NavButtonProps {
  direction: Direction;
  style: Style;
  mode: Mode;
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  onPageChange?: (page: number) => void;
}

/**
 * 上/下一页导航按钮，统一处理 desktop/mobile × link/button 四种组合
 */
function NavButton({ direction, style, mode, currentPage, totalPages, baseUrl, onPageChange }: NavButtonProps) {
  const isPrev = direction === "prev";
  const targetPage = isPrev ? currentPage - 1 : currentPage + 1;
  const isDisabled = isPrev ? currentPage <= 1 : currentPage >= totalPages;
  const href = pageHref(baseUrl, targetPage);
  const label = isPrev ? "上一页" : "下一页";
  const Icon = isPrev ? ChevronLeft : ChevronRight;

  const enabledClass = style === "desktop" ? DESKTOP_NAV_CLASS : MOBILE_NAV_CLASS;
  const disabledClass =
    style === "desktop" ? DESKTOP_NAV_DISABLED_CLASS : `${MOBILE_NAV_CLASS} cursor-not-allowed`;

  const content =
    style === "desktop" ? (
      <>
        {isPrev && <Icon className="w-4 h-4" />}
        {label}
        {!isPrev && <Icon className="w-4 h-4" />}
      </>
    ) : (
      <Icon className={`w-5 h-5 ${isDisabled ? "text-muted-foreground/50" : ""}`} />
    );

  if (mode === "link") {
    if (isDisabled) {
      return <span className={disabledClass}>{content}</span>;
    }
    return (
      <Link href={href} className={enabledClass} aria-label={style === "mobile" ? label : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => onPageChange?.(targetPage)}
      disabled={isDisabled}
      className={enabledClass}
      aria-label={style === "mobile" ? label : undefined}
    >
      {content}
    </button>
  );
}

interface PageNumbersProps {
  pages: (number | string)[];
  currentPage: number;
  mode: Mode;
  baseUrl: string;
  onPageChange?: (page: number) => void;
}

function PageNumbers({ pages, currentPage, mode, baseUrl, onPageChange }: PageNumbersProps) {
  const pageLinkClass =
    "px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors min-w-[36px] text-center";

  return (
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
            <Link href={pageHref(baseUrl, page as number)} className={pageLinkClass}>
              {page}
            </Link>
          ) : (
            <button onClick={() => onPageChange?.(page as number)} className={pageLinkClass}>
              {page}
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

function SimpleIndicator({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <div className="flex items-center gap-1 text-sm min-w-[80px] justify-center">
      <span className="font-medium text-foreground">{currentPage}</span>
      <span className="text-muted-foreground">/</span>
      <span className="text-muted-foreground">{totalPages}</span>
    </div>
  );
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

  const navProps = { mode, currentPage, totalPages, baseUrl, onPageChange };

  return (
    <nav className="flex items-center justify-center" aria-label="分页">
      {/* 桌面端：完整分页 */}
      <div className="hidden md:flex items-center gap-2">
        <NavButton direction="prev" style="desktop" {...navProps} />
        {variant === "full" && (
          <PageNumbers
            pages={getVisiblePages(currentPage, totalPages)}
            currentPage={currentPage}
            mode={mode}
            baseUrl={baseUrl}
            onPageChange={onPageChange}
          />
        )}
        {variant === "simple" && <SimpleIndicator currentPage={currentPage} totalPages={totalPages} />}
        <NavButton direction="next" style="desktop" {...navProps} />
      </div>

      {/* 移动端：简化分页 */}
      <div className="flex md:hidden items-center gap-4">
        <NavButton direction="prev" style="mobile" {...navProps} />
        <SimpleIndicator currentPage={currentPage} totalPages={totalPages} />
        <NavButton direction="next" style="mobile" {...navProps} />
      </div>
    </nav>
  );
}
