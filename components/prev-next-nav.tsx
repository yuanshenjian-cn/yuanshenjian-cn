import Link from "next/link";
import { Post } from "@/types/blog";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PrevNextNavProps {
  prev: Post | null;
  next: Post | null;
  prevLabel?: string;
  nextLabel?: string;
}

function postHref(post: Post): string {
  return `/articles/${post.year}/${post.month}/${post.day}/${post.slug}`;
}

/**
 * 通用上一篇/下一篇导航。用于文章页与专栏上下文。
 */
export function PrevNextNav({
  prev,
  next,
  prevLabel = "上一篇",
  nextLabel = "下一篇",
}: PrevNextNavProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={postHref(prev)}
          className="group p-4 rounded-lg border hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <ArrowLeft className="w-4 h-4" />
            {prevLabel}
          </div>
          <div className="font-medium text-sm line-clamp-2">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}

      {next ? (
        <Link
          href={postHref(next)}
          className="group p-4 rounded-lg border hover:border-primary/50 transition-colors text-right"
        >
          <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1">
            {nextLabel}
            <ArrowRight className="w-4 h-4" />
          </div>
          <div className="font-medium text-sm line-clamp-2">{next.title}</div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}
