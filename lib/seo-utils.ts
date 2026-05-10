import type { Metadata } from "next";
import { config } from "./config";
import { Post } from "@/types/blog";

const SITE_NAME = config.site.name;
const DEFAULT_OG_IMAGE = `${config.site.url}${config.site.ogImage}`;

/**
 * 生成 Open Graph 元数据
 * @see https://ogp.me/
 */
export function generateOpenGraph(
  post: Post,
  url: string,
  options?: {
    customImage?: string;
    customDescription?: string;
  }
) {
  // 计算阅读时间文本
  const readingTimeText = `阅读约 ${post.readingTime} 分钟`;

  // 构建更丰富的描述
  const enrichedDescription = options?.customDescription ||
    `${post.excerpt} | ${readingTimeText} | 标签: ${post.tags.slice(0, 3).join(', ')}`;

  // 生成或获取 OG 图片
  const ogImage = options?.customImage || DEFAULT_OG_IMAGE;

  return {
    title: post.title,
    description: enrichedDescription,
    type: 'article' as const,
    url: url,
    siteName: SITE_NAME,
    locale: config.site.locale,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: post.title,
      },
    ],
    publishedTime: post.date,
    modifiedTime: post.date,
    authors: [config.author.name],
    tags: post.tags,
    section: post.category || '技术',
  };
}

/**
 * 生成 Twitter Card 元数据
 * @see https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/summary-card-with-large-image
 */
export function generateTwitterCard(
  post: Post,
  options?: {
    customImage?: string;
    customDescription?: string;
  }
) {
  // Twitter 描述限制在 200 字符以内
  const maxDescLength = 180;
  let description = options?.customDescription || post.excerpt;
  if (description.length > maxDescLength) {
    description = description.substring(0, maxDescLength - 3) + '...';
  }

  const twitterImage = options?.customImage || DEFAULT_OG_IMAGE;

  return {
    card: 'summary_large_image',
    site: config.author.twitter,
    creator: config.author.twitter,
    title: post.title,
    description: description,
    images: [twitterImage],
  };
}

/**
 * 生成文章列表页面的 OG 和 Twitter 元数据
 */
export function generateListPageSEO(
  title: string,
  description: string,
  url: string,
  options?: {
    image?: string;
    pageNumber?: number;
    totalPages?: number;
    paginationPath?: (page: number) => string;
  }
): Metadata {
  const pageTitle = options?.pageNumber && options.pageNumber > 1
    ? `${title} - 第 ${options.pageNumber} 页`
    : title;

  const fullTitle = pageTitle === SITE_NAME
    ? pageTitle
    : `${pageTitle} | ${SITE_NAME}`;

  const ogImage = options?.image || DEFAULT_OG_IMAGE;
  const resolvePageUrl = (page?: number) => {
    if (!page || page <= 1) return url;
    if (!options?.paginationPath) return `${url}?page=${page}`;
    return new URL(options.paginationPath(page), config.site.url).toString();
  };
  const currentUrl = resolvePageUrl(options?.pageNumber);

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: currentUrl,
      siteName: SITE_NAME,
      locale: config.site.locale,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: pageTitle,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description.slice(0, 180),
      images: [ogImage],
    },
    alternates: {
      canonical: currentUrl,
      ...(options?.totalPages ? {
        pagination: {
          previous: options.pageNumber && options.pageNumber > 1
            ? resolvePageUrl(options.pageNumber - 1)
            : undefined,
          next: options.pageNumber && options.totalPages && options.pageNumber < options.totalPages
            ? resolvePageUrl(options.pageNumber + 1)
            : undefined,
        },
      } : {}),
    },
  };
}

/**
 * 验证并修复 SEO 元数据中的常见问题
 */
export function validateSEOData(data: {
  title?: string;
  description?: string;
  image?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.length < 10) {
    errors.push('标题太短（建议 10-60 字符）');
  }
  if (data.title && data.title.length > 70) {
    errors.push('标题太长（建议 60 字符以内）');
  }

  if (!data.description || data.description.length < 50) {
    errors.push('描述太短（建议 50-160 字符）');
  }
  if (data.description && data.description.length > 200) {
    errors.push('描述太长（建议 160 字符以内）');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
