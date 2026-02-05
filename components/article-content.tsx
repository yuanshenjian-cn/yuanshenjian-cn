import { Suspense } from "react";
import { MDXContent as MDXRemoteContent } from "@/lib/mdx";
import { PostNavigation } from "@/components/post-navigation";
import { WalineCommentsContainer } from "@/components/waline-comments-container";
import { ArticleHeader } from "@/components/article-header";
import type { Post } from "@/types/blog";

interface ArticleContentProps {
  post: Post;
  prev: Post | null;
  next: Post | null;
  slug: string;
  showHeader?: boolean;
}

export function ArticleContent({ post, prev, next, slug, showHeader = true }: ArticleContentProps) {
  return (
    <>
      {showHeader && <ArticleHeader post={post} />}

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
          <MDXRemoteContent source={post.content} />
        </Suspense>
      </div>

      <div className="mt-12 pt-8 border-t">
        <PostNavigation prev={prev} next={next} />
      </div>

      <WalineCommentsContainer path={`/articles/${post.year}/${post.month}/${post.day}/${slug}`} />
    </>
  );
}
