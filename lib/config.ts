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
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "yuanshenjian-cn/yuanshenjian-cn",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "R_kgDORINV5g",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "DIC_kwDORINV5s4C19yc",
  },
} as const;

export const POSTS_PER_PAGE = config.posts.perPage;
