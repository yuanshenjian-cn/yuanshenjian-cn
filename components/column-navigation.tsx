import Link from "next/link";
import type { ColumnContext } from "@/lib/columns";
import { getColumnIconBySlug } from "@/components/column-icons";
import { PrevNextNav } from "@/components/prev-next-nav";

interface ColumnNavigationProps {
  context: ColumnContext;
}

export function ColumnNavigation({ context }: ColumnNavigationProps) {
  const { column, currentIndex, totalPosts, prev, next } = context;
  const Icon = getColumnIconBySlug(column.slug);

  return (
    <div className="space-y-3">
      {/* 专栏信息 */}
      <div className="flex items-center justify-between">
        <Link
          href={`/ai/${column.slug}`}
          className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
        >
          {Icon && <Icon className="w-4 h-4" />}
          {column.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {currentIndex + 1} / {totalPosts}
        </span>
      </div>

      {/* 上一篇 / 下一篇 */}
      <PrevNextNav prev={prev} next={next} />
    </div>
  );
}
