import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPostBySlug, getAllPosts, getAdjacentPosts } from "@/lib/blog";
import { MDXContent, extractHeadings } from "@/lib/mdx";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { TableOfContents } from "@/components/table-of-contents";
import { PostNavigation } from "@/components/post-navigation";
import Script from "next/script";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "文章未找到",
    };
  }

  return {
    title: `${post.title} | 博客`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { prev, next } = getAdjacentPosts(slug);
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
      <article className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
            <div className="order-2 lg:order-1 max-w-3xl">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Link>

              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-medium mb-4">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(post.date).toLocaleDateString("zh-CN")}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readingTime} 分钟
                  </span>
                </div>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                )}
              </header>

              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
                  <MDXContent source={post.content} />
                </Suspense>
              </div>

              <div className="mt-12 pt-8 border-t">
                <PostNavigation prev={prev} next={next} />
              </div>
            </div>

            <aside className="order-1 lg:order-2">
              <div className="sticky top-24">
                {headings.length > 0 && (
                  <div className="bg-card rounded-lg p-4 border">
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground">
                      目录
                    </h3>
                    <TableOfContents headings={headings} />
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </article>
    </>
  );
}
