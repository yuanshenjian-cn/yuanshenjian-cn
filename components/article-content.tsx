import { Suspense } from "react";
import { MDXContent as MDXRemoteContent } from "@/lib/mdx";
import { PostNavigation } from "@/components/post-navigation";
import { WalineCommentsContainer } from "@/components/waline-comments-container";
import { ArticleHeader } from "@/components/article-header";
import { ShareButtons } from "@/components/share-buttons";
import type { Post } from "@/types/blog";

interface ArticleContentProps {
  post: Post;
  prev: Post | null;
  next: Post | null;
  slug: string;
  showHeader?: boolean;
  url?: string;
}

export function ArticleContent({ post, prev, next, slug, showHeader = true, url }: ArticleContentProps) {
  const shareUrl = url || `${typeof window !== 'undefined' ? window.location.origin : ''}/articles/${post.year}/${post.month}/${post.day}/${slug}`;

  return (
    <>
      {showHeader && <ArticleHeader post={post} />}

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
          <MDXRemoteContent source={post.content} />
        </Suspense>
      </div>

      {/* 分享按钮 - 无上边框，更简洁 */}
      <div className="mt-10">
        <ShareButtons
          url={shareUrl}
          title={post.title}
          description={post.excerpt}
        />
      </div>

      <div className="mt-8">
        <PostNavigation prev={prev} next={next} />
      </div>

      <WalineCommentsContainer path={`/articles/${post.year}/${post.month}/${post.day}/${slug}`} />
    </>
  );
}
