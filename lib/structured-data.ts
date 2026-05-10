import { config } from "./config";
import { Post } from "@/types/blog";
import { cleanContent } from "@/lib/utils";

/**
 * 生成文章（BlogPosting）结构化数据
 * @see https://schema.org/BlogPosting
 */
export function generateArticleStructuredData(post: Post, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: url,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: config.author.name,
      url: config.site.url,
      sameAs: config.author.sameAs,
    },
    publisher: {
      "@type": "Organization",
      name: config.site.name,
      logo: {
        "@type": "ImageObject",
        url: `${config.site.url}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: post.tags.join(", "),
    articleSection: post.category || "技术",
    wordCount: cleanContent(post.content).length,
    timeRequired: `PT${post.readingTime}M`,
    inLanguage: "zh-CN",
    isAccessibleForFree: true,
  };
}

/**
 * 生成面包屑导航（BreadcrumbList）结构化数据
 * @see https://schema.org/BreadcrumbList
 */
export function generateBreadcrumbStructuredData(
  breadcrumbs: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * 生成网站（WebSite）结构化数据
 * @see https://schema.org/WebSite
 */
export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: config.site.name,
    description: config.site.description,
    url: config.site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${config.site.url}/articles?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * 生成作者（Person）结构化数据
 * @see https://schema.org/Person
 */
export function generatePersonStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: config.author.name,
    url: config.site.url,
    sameAs: config.author.sameAs,
    jobTitle: config.author.jobTitle,
    worksFor: {
      "@type": "Organization",
      name: config.author.organization,
    },
  };
}

/**
 * 生成文章列表页（CollectionPage）结构化数据
 * @see https://schema.org/CollectionPage
 */
export function generateCollectionPageStructuredData(
  title: string,
  description: string,
  url: string,
  posts: Post[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: description,
    url: url,
    isPartOf: {
      "@type": "WebSite",
      name: config.site.name,
      url: config.site.url,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${config.site.url}/articles/${post.slug}`,
        name: post.title,
      })),
    },
  };
}
