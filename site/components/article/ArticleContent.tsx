import { Suspense, type ReactNode } from "react";
import { MDXContent as MDXRemoteContent } from "@/lib/mdx";
import { ColumnNavigation } from "@/components/ColumnNavigation";
import { CommentSection } from "@/components/comments/CommentSection";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { PostNavigation } from "@/components/PostNavigation";
import { ShareButtons } from "@/components/ShareButtons";
import { TermHighlighter } from "@/components/article/TermHighlighter";
import { TextSelectionAIActions } from "@/components/article/TextSelectionAIActions";
import { config } from "@/lib/config";
import type { Post } from "@/types/blog";
import type { ColumnContext } from "@/lib/columns";

interface ArticleContentProps {
  post: Post;
  prev: Post | null;
  next: Post | null;
  slug: string;
  showHeader?: boolean;
  url?: string;
  shareTitle?: string;
  shareDescription?: string;
  columnContext?: ColumnContext | null;
  footerAssistant?: ReactNode;
  turnstileSiteKey?: string;
}

export async function ArticleContent({ post, prev, next, slug, showHeader = true, url, shareTitle, shareDescription, columnContext, footerAssistant, turnstileSiteKey = "" }: ArticleContentProps) {
  const shareUrl = url || `/articles/${slug}`;

  return (
    <>
      {showHeader && <ArticleHeader post={post} />}

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <div id="intro" />
        <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
          <MDXRemoteContent source={post.content} />
          <TermHighlighter />
        </Suspense>
      </div>

      <TextSelectionAIActions maxInputChars={config.ai.maxInputChars} />

      {/* 分享按钮 - 无上边框，更简洁 */}
      <div className="mt-10">
        <ShareButtons
          url={shareUrl}
          title={shareTitle || post.title}
          description={shareDescription || post.excerpt}
        />
      </div>

      {footerAssistant ? footerAssistant : null}

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

      <CommentSection slug={post.slug} turnstileSiteKey={turnstileSiteKey} />
    </>
  );
}
