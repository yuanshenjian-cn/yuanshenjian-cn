import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllTags, getAllPosts, POSTS_PER_PAGE } from "@/lib/blog";
import { ArticlesContent } from "@/components/articles-content";

export const metadata: Metadata = {
  title: "文章 | 袁慎建",
  description: "分享技术知识、生活感悟与个人想法",
};

export default async function ArticlesPage() {
  const allPosts = getAllPosts();
  const tags = getAllTags();
  
  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<ArticlesSkeleton />}>
          <ArticlesContent 
            allPosts={allPosts} 
            tags={tags} 
            postsPerPage={POSTS_PER_PAGE}
          />
        </Suspense>
      </div>
    </main>
  );
}

function ArticlesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-32 bg-muted rounded mb-2"></div>
        <div className="h-4 w-48 bg-muted rounded"></div>
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-16 bg-muted rounded"></div>
        ))}
      </div>
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-6 w-3/4 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
