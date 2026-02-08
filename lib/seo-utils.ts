import { config } from "./config";
import { Post } from "@/types/blog";

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
  const ogImage = options?.customImage || generateOGImage(post);

  return {
    title: post.title,
    description: enrichedDescription,
    type: 'article',
    url: url,
    siteName: '袁慎建的技术博客',
    locale: 'zh_CN',
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: post.title,
      },
    ],
    // Article 特定属性
    article: {
      publishedTime: post.date,
      modifiedTime: post.date, // 如果有最后修改时间，使用 post.lastModified
      authors: ['袁慎建'],
      tags: post.tags,
      section: post.category || '技术',
    },
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

  // Twitter 图片推荐尺寸: 1200x675 (最小 300x157)
  const twitterImage = options?.customImage || generateOGImage(post);

  return {
    card: 'summary_large_image',
    site: '@yuanshenjian', // 如果有 Twitter 账号
    creator: '@yuanshenjian',
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
  }
) {
  const pageTitle = options?.pageNumber && options.pageNumber > 1
    ? `${title} - 第 ${options.pageNumber} 页`
    : title;
  
  const fullTitle = pageTitle === '袁慎建的技术博客' 
    ? pageTitle 
    : `${pageTitle} | 袁慎建的技术博客`;

  const ogImage = options?.image || `${config.site.url}/images/og-default.jpg`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      type: 'website',
      url: options?.pageNumber ? `${url}?page=${options.pageNumber}` : url,
      siteName: '袁慎建的技术博客',
      locale: 'zh_CN',
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
    alternates: options?.totalPages ? {
      canonical: options.pageNumber ? `${url}?page=${options.pageNumber}` : url,
      prev: options.pageNumber && options.pageNumber > 1 
        ? (options.pageNumber === 2 ? url : `${url}?page=${options.pageNumber - 1}`)
        : undefined,
      next: options.pageNumber && options.totalPages && options.pageNumber < options.totalPages
        ? `${url}?page=${options.pageNumber + 1}`
        : undefined,
    } : undefined,
  };
}

/**
 * 生成默认的 OG 图片 URL
 * 如果文章有封面图则使用封面图，否则使用默认 OG 图片
 */
function generateOGImage(_post: Post): string {
  // 如果文章有封面图，使用封面图
  // 注：目前 Post 类型没有 coverImage 字段，需要时可添加
  // if (post.coverImage) {
  //   return post.coverImage;
  // }

  // 否则使用默认 OG 图片
  return `${config.site.url}/images/og-default.jpg`;
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
