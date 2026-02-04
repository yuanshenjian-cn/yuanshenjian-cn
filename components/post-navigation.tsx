import Link from "next/link";
import { Post } from "@/types/blog";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface PostNavigationProps {
  prev: Post | null;
  next: Post | null;
}

export function PostNavigation({ prev, next }: PostNavigationProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {prev ? (
        <Link
          href={`/blog/${prev.slug}`}
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
          href={`/blog/${next.slug}`}
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
  );
}
