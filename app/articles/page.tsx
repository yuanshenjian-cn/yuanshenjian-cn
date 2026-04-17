import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllTags, getAllPosts } from "@/lib/blog";
import { POSTS_PER_PAGE, config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";
import { ArticlesContent } from "@/components/articles-content";
import { ArticlesSkeleton } from "@/components/articles-skeleton";

export const metadata: Metadata = generateListPageSEO(
  "文章",
  "分享技术知识、生活感悟与个人想法",
  `${config.site.url}/articles`,
);

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
