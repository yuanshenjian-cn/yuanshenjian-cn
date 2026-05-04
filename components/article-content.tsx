import { Suspense, type ReactNode } from "react";
import { MDXContent as MDXRemoteContent } from "@/lib/mdx";
import { PostNavigation } from "@/components/post-navigation";
import { ColumnNavigation } from "@/components/column-navigation";
import { GiscusCommentsContainer } from "@/components/giscus-comments-container";
import { ArticleHeader } from "@/components/article-header";
import { ShareButtons } from "@/components/share-buttons";
import type { Post } from "@/types/blog";
import type { ColumnContext } from "@/lib/columns";

interface ArticleContentProps {
  post: Post;
  prev: Post | null;
  next: Post | null;
  slug: string;
  showHeader?: boolean;
  url?: string;
  columnContext?: ColumnContext | null;
  footerAssistant?: ReactNode;
}

export function ArticleContent({ post, prev, next, slug, showHeader = true, url, columnContext, footerAssistant }: ArticleContentProps) {
  // URL 由父组件（服务端）传入，确保 SSR 和客户端一致
  const shareUrl = url || `/articles/${slug}`;

  return (
    <>
      {showHeader && <ArticleHeader post={post} />}

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <div id="intro" />
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

      {/* 专栏导航（含上下篇）或全局上下篇导航，二选一 */}
      {columnContext ? (
        <div className="mt-8">
          <ColumnNavigation context={columnContext} globalPrev={prev} globalNext={next} />
        </div>
      ) : (
        <div className="mt-8">
          <PostNavigation prev={prev} next={next} />
        </div>
      )}

      {footerAssistant ? footerAssistant : null}

      <GiscusCommentsContainer path={`/articles/${slug}`} />
    </>
  );
}
