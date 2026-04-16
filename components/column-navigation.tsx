import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ColumnContext } from "@/lib/columns";
import { getColumnIconBySlug } from "@/components/column-icons";

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prev ? (
          <Link
            href={`/articles/${prev.year}/${prev.month}/${prev.day}/${prev.slug}`}
            className="group p-4 rounded-lg border hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ArrowLeft className="w-4 h-4" />
              上一篇
            </div>
            <div className="font-medium text-sm line-clamp-2">
              {prev.title}
            </div>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={`/articles/${next.year}/${next.month}/${next.day}/${next.slug}`}
            className="group p-4 rounded-lg border hover:border-primary/50 transition-colors text-right"
          >
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
              下一篇
              <ArrowRight className="w-4 h-4" />
            </div>
            <div className="font-medium text-sm line-clamp-2">
              {next.title}
            </div>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
