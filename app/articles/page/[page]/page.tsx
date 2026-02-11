import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllTags, getAllPosts, POSTS_PER_PAGE } from "@/lib/blog";
import { ArticlesContent } from "@/components/articles-content";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ page: string }>;
}

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
  return {
    title: `文章 | 第 ${page} 页 | 袁慎建`,
    description: "分享技术知识、生活感悟与个人想法",
    openGraph: {
      title: `文章 | 第 ${page} 页 | 袁慎建`,
      description: "分享技术知识、生活感悟与个人想法",
      type: "website",
      images: [
        {
          url: "/images/og-default.webp",
          width: 1200,
          height: 630,
          alt: "袁慎建的文章",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `文章 | 第 ${page} 页 | 袁慎建`,
      description: "分享技术知识、生活感悟与个人想法",
      images: ["/images/og-default.webp"],
    },
  };
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
        <Suspense fallback={<div className="py-8 text-center">加载中...</div>}>
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
