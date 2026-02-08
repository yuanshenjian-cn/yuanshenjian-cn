import { config } from "./config";
import { Post } from "@/types/blog";

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
    dateModified: post.date, // 如果有最后修改时间，使用 post.lastModified
    author: {
      "@type": "Person",
      name: "袁慎建",
      url: config.site.url,
      sameAs: [
        // 可以添加社交媒体链接
        // "https://github.com/yourusername",
      ],
    },
    publisher: {
      "@type": "Organization",
      name: "袁慎建的技术博客",
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
    wordCount: post.content.split(/\s+/).length,
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
    name: "袁慎建的技术博客",
    description: "分享技术知识、生活感悟与个人想法",
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
    name: "袁慎建",
    url: config.site.url,
    sameAs: [
      // 可以添加 GitHub、Twitter 等社交链接
      // "https://github.com/yourusername",
      // "https://twitter.com/yourusername",
    ],
    jobTitle: "软件开发工程师",
    worksFor: {
      "@type": "Organization",
      name: "ThoughtWorks",
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
      name: "袁慎建的技术博客",
      url: config.site.url,
    },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((post, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${config.site.url}/articles/${post.year}/${post.month}/${post.day}/${post.slug}`,
        name: post.title,
      })),
    },
  };
}
