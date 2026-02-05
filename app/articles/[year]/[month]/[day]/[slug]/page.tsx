import { notFound } from "next/navigation";
import { Suspense, lazy } from "react";
import { getPostByDateAndSlug, getAllPosts, getAdjacentPosts } from "@/lib/blog";
import { MDXContent as MDXRemoteContent, extractHeadings } from "@/lib/mdx";
import Script from "next/script";
import { ArticleContent } from "@/components/article-content";
import { ArticleHeader } from "@/components/article-header";

const TableOfContents = lazy(() => import("@/components/table-of-contents").then((mod) => ({ default: mod.TableOfContents })));

interface Props {
  params: Promise<{ year: string; month: string; day: string; slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    year: post.year,
    month: post.month,
    day: post.day,
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { year, month, day, slug } = await params;
  const post = getPostByDateAndSlug(year, month, day, slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: `${post.title} | 文章`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { year, month, day, slug } = await params;
  const post = getPostByDateAndSlug(year, month, day, slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = getAdjacentPosts(year, month, day, slug);
  const headings = extractHeadings(post.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: "博客作者",
    },
  };

  return (
    <>
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="py-12 px-6">
        {headings.length > 0 ? (
          <>
            {/* Desktop: 阅读区和目录一起整体居中 */}
            <div className="hidden lg:flex lg:justify-center lg:gap-8">
              <div className="w-full max-w-2xl">
                <ArticleContent post={post} prev={prev} next={next} slug={slug} />
              </div>
              <aside className="w-60 flex-shrink-0">
                <div className="sticky top-24">
                  <div className="bg-card rounded-lg p-4 border">
                    <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse"></div>}>
                      <TableOfContents headings={headings} />
                    </Suspense>
                  </div>
                </div>
              </aside>
            </div>

            {/* Mobile: 标题 → 目录 → 正文 */}
            <div className="lg:hidden max-w-2xl mx-auto">
              <ArticleHeader post={post} />
              <div className="my-8">
                <div className="bg-card rounded-lg p-4 border">
                  <Suspense fallback={<div className="h-48 bg-muted rounded animate-pulse"></div>}>
                    <TableOfContents headings={headings} />
                  </Suspense>
                </div>
              </div>
              <ArticleContent post={post} prev={prev} next={next} slug={slug} showHeader={false} />
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <ArticleContent post={post} prev={prev} next={next} slug={slug} />
          </div>
        )}
      </article>
    </>
  );
}
