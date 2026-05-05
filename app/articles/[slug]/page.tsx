import { notFound } from "next/navigation";
import { getPostBySlug, getAllPosts, getAdjacentPosts } from "@/lib/blog";
import { getColumnContextByPost } from "@/lib/columns";
import { extractHeadings } from "@/lib/mdx";
import { config } from "@/lib/config";
import Script from "next/script";
import { ArticleAiAssistant } from "@/components/ai/article-ai-assistant";
import { PageAIAssistantProvider } from "@/components/ai/page-ai-assistant-provider";
import { ArticleContent } from "@/components/article-content";
import { ArticleHeader } from "@/components/article-header";
import { TableOfContents } from "@/components/table-of-contents";
import { FloatingTocButton } from "@/components/floating-toc-button";
import { ReadingProgress } from "@/components/reading-progress";
import { generateOpenGraph, generateTwitterCard } from "@/lib/seo-utils";
import { generateArticleStructuredData, generateBreadcrumbStructuredData } from "@/lib/structured-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

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

  const postUrl = `${config.site.url}/articles/${slug}`;
  const og = generateOpenGraph(post, postUrl);
  const twitter = generateTwitterCard(post);

  return {
    title: `${post.title} | ${config.site.name}`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: config.author.name }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: og,
    twitter: twitter,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
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
  const postUrl = `${config.site.url}/articles/${slug}`;
  const columnContext = getColumnContextByPost(post);

  const articleStructuredData = generateArticleStructuredData(post, postUrl);

  const breadcrumbs = [
    { name: "首页", url: config.site.url },
    { name: "文章", url: `${config.site.url}/articles` },
    { name: post.title, url: postUrl },
  ];
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbs);

  const allStructuredData = [articleStructuredData, breadcrumbStructuredData];
  const pageAssistantEnabled = config.ai.pageAssistantEnabled;

  const articleBody = (
    <>
      <ArticleHeader post={post} />

      {pageAssistantEnabled ? <ArticleAiAssistant variant="primary" /> : null}

      {headings.length > 0 ? (
        <div className="my-8 lg:hidden">
          <div className="bg-card rounded-lg p-4 border">
            <TableOfContents headings={headings} />
          </div>
        </div>
      ) : null}

      <ArticleContent
        post={post}
        prev={prev}
        next={next}
        slug={slug}
        showHeader={false}
        url={postUrl}
        columnContext={columnContext}
        footerAssistant={pageAssistantEnabled ? <ArticleAiAssistant variant="footer" /> : undefined}
      />
    </>
  );

  const articleContent = pageAssistantEnabled ? (
    <PageAIAssistantProvider
      scene="article"
      context={{ slug }}
      workerUrl={config.ai.workerUrl}
      turnstileSiteKey={config.ai.turnstileSiteKey}
      turnstileTimeoutMs={config.ai.turnstile.timeoutMs.pageAssistant.article}
      maxInputChars={config.ai.maxInputChars}
    >
      {articleBody}
    </PageAIAssistantProvider>
  ) : (
    articleBody
  );

  return (
    <>
      <ReadingProgress />
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(allStructuredData),
        }}
      />
      <article className="py-12 px-6">
        {headings.length > 0 ? (
          <div className="max-w-6xl mx-auto lg:flex lg:justify-center lg:gap-8">
            <div className="w-full max-w-2xl mx-auto lg:mx-0 overflow-hidden">
              {articleContent}
            </div>

            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="bg-card rounded-lg p-4 border">
                  <TableOfContents headings={headings} />
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto overflow-hidden">
            {articleContent}
          </div>
        )}
      </article>

      {headings.length > 0 && <FloatingTocButton headings={headings} />}
    </>
  );
}
