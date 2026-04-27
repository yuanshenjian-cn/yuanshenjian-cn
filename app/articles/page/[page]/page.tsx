import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllTags, getAllPosts } from "@/lib/blog";
import { POSTS_PER_PAGE, config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";
import { ArticlesContent } from "@/components/articles-content";
import { ArticlesSkeleton } from "@/components/articles-skeleton";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ page: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = getAllPosts();
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  // 从第2页开始，第1页在 /articles
  const pages = [];
  for (let i = 2; i <= totalPages; i++) {
    pages.push({ page: i.toString() });
  }
  return pages;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parseInt(page, 10);
  const allPosts = getAllPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

  return generateListPageSEO(
    "文章",
    "分享技术知识、生活感悟与个人想法",
    `${config.site.url}/articles`,
    {
      pageNumber,
      totalPages,
      paginationPath: (page) => page === 1 ? "/articles" : `/articles/page/${page}`,
    },
  );
}

export default async function ArticlesPage({ params }: Props) {
  const { page: pageParam } = await params;
  const page = parseInt(pageParam, 10);

  const allPosts = getAllPosts();
  const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);

  // 验证页码
  if (page < 2 || page > totalPages) {
    notFound();
  }

  const tags = getAllTags();

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Suspense fallback={<ArticlesSkeleton />}>
          <ArticlesContent
            allPosts={allPosts}
            tags={tags}
            postsPerPage={POSTS_PER_PAGE}
            initialPage={page}
          />
        </Suspense>
      </div>
    </main>
  );
}
