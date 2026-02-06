export const config = {
  posts: {
    perPage: 12,
  },
  readingTime: {
    charactersPerMinute: 600,
    wordsPerMinute: 200,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yuanshenjian.cn",
  },
} as const;

export const POSTS_PER_PAGE = config.posts.perPage;
