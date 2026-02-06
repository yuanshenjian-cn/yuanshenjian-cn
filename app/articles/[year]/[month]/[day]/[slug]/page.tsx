import { notFound } from "next/navigation";
import { getPostByDateAndSlug, getAllPosts, getAdjacentPosts } from "@/lib/blog";
import { extractHeadings } from "@/lib/mdx";
import Script from "next/script";
import { ArticleContent } from "@/components/article-content";
import { ArticleHeader } from "@/components/article-header";
import { TableOfContents } from "@/components/table-of-contents";
import { FloatingTocButton } from "@/components/floating-toc-button";

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
          <div className="max-w-6xl mx-auto lg:flex lg:justify-center lg:gap-8">
            {/* 移动端目录（在正文前，不固定） */}
            <div className="lg:hidden max-w-2xl mx-auto mb-8">
              <ArticleHeader post={post} />
              <div className="my-8">
                <div className="bg-card rounded-lg p-4 border">
                  <TableOfContents headings={headings} />
                </div>
              </div>
            </div>

            {/* 正文内容 - 只渲染一次 */}
            <div className="w-full max-w-2xl mx-auto lg:mx-0 overflow-hidden">
              {/* 桌面版 header */}
              <div className="hidden lg:block">
                <ArticleContent post={post} prev={prev} next={next} slug={slug} />
              </div>
              {/* 移动版正文（无 header） */}
              <div className="lg:hidden">
                <ArticleContent post={post} prev={prev} next={next} slug={slug} showHeader={false} />
              </div>
            </div>

            {/* 桌面端目录（固定） */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-24">
                <div className="bg-card rounded-lg p-4 border">
                  <TableOfContents headings={headings} />
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto overflow-hidden">
            <ArticleContent post={post} prev={prev} next={next} slug={slug} />
          </div>
        )}
      </article>
      
      {/* 移动端浮动目录按钮 */}
      {headings.length > 0 && <FloatingTocButton headings={headings} />}
    </>
  );
}
