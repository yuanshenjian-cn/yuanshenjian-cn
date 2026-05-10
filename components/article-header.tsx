import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import type { Post } from "@/types/blog";

interface ArticleHeaderProps {
  post: Post;
}

export function ArticleHeader({ post }: ArticleHeaderProps) {
  return (
    <>
      <Link
        href="/articles"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        返回文章列表
      </Link>

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-medium mb-4">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {post.tags.map((tag: string) => (
              <Link
                key={tag}
                href={`/articles?tag=${encodeURIComponent(tag)}`}
                className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
