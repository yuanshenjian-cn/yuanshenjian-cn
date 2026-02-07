import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  mode: "link" | "button";
  baseUrl?: string;
  onPageChange?: (page: number) => void;
}

export function PaginationNav({
  currentPage,
  totalPages,
  mode,
  baseUrl = "",
  onPageChange,
}: PaginationNavProps) {
  if (totalPages <= 1) return null;

  const desktopContent = (
    <>
      {/* 上一页 */}
      {mode === "link" ? (
        currentPage > 1 ? (
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
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
      )}

      {/* 页码指示器 */}
      <span className="px-3 py-2 text-sm">
        第 {currentPage} / {totalPages} 页
      </span>

      {/* 下一页 */}
      {mode === "link" ? (
        currentPage < totalPages ? (
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
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      )}
    </>
  );

  const mobileContent = (
    <>
      {/* 上一页按钮 */}
      {mode === "link" ? (
        currentPage > 1 ? (
          <Link
            href={currentPage === 2 ? "/articles" : `${baseUrl}/${currentPage - 1}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 transition-all"
            aria-label="上一页"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 cursor-not-allowed">
            <ChevronLeft className="w-5 h-5 text-muted-foreground/50" />
          </span>
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 disabled:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:active:scale-100 transition-all"
          aria-label="上一页"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {/* 页码指示器 */}
      <div className="flex items-center gap-1 text-sm min-w-[60px] justify-center">
        <span className="font-medium text-foreground">{currentPage}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{totalPages}</span>
      </div>

      {/* 下一页按钮 */}
      {mode === "link" ? (
        currentPage < totalPages ? (
          <Link
            href={`${baseUrl}/${currentPage + 1}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 transition-all"
            aria-label="下一页"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        ) : (
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 cursor-not-allowed">
            <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
          </span>
        )
      ) : (
        <button
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-muted hover:bg-accent hover:text-accent-foreground active:scale-95 active:bg-muted/60 disabled:bg-muted/50 disabled:cursor-not-allowed disabled:hover:bg-muted/50 disabled:active:scale-100 transition-all"
          aria-label="下一页"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );

  return (
    <nav className="flex items-center justify-center" aria-label="分页">
      {/* 桌面端 */}
      <div className="hidden md:flex items-center gap-2">{desktopContent}</div>

      {/* 移动端 */}
      <div className="flex md:hidden items-center gap-4">{mobileContent}</div>
    </nav>
  );
}
