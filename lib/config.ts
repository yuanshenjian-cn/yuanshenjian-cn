export const config = {
  posts: {
    perPage: 12,
    excerptLength: 200,
  },
  readingTime: {
    charactersPerMinute: 600,
    wordsPerMinute: 200,
  },
  site: {
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://yuanshenjian.cn",
    name: "袁慎建的博客",
    description: "记录思考，分享成长。技术实践、敏捷方法、生活随笔。",
    ogImage: "/images/og-default.webp",
    locale: "zh_CN",
  },
  author: {
    name: "袁慎建",
    email: "yuanshenjian@foxmail.com",
    jobTitle: "软件开发工程师",
    organization: "ThoughtWorks",
    twitter: "@yuanshenjian",
    sameAs: [] as string[],
  },
  giscus: {
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO || "yuanshenjian-cn/yuanshenjian-cn",
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID || "R_kgDORINV5g",
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID || "DIC_kwDORINV5s4C19yc",
  },
  ai: {
    enabled: process.env.NEXT_PUBLIC_AI_ENABLED !== "false",
    workerUrl: process.env.NEXT_PUBLIC_AI_WORKER_URL || "/api/ai",
    turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  },
} as const;

export const POSTS_PER_PAGE = config.posts.perPage;
export const EXCERPT_LENGTH = config.posts.excerptLength;
