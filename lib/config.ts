import type { AIQuickTopic } from "@/types/ai";

const aiQuickTopics: AIQuickTopic[] = [
  {
    label: "AI 前沿",
    prompt: "请推荐我博客里和 AI 前沿、模型发布动态、厂商更新相关的文章，并说明各自最值得关注的点。",
  },
  {
    label: "AI 编程",
    prompt: "请推荐我博客里和 AI 编程、AI 辅助开发相关的文章，并按入门到进阶排序。",
  },
  {
    label: "OpenAI",
    prompt: "请推荐我博客里和 OpenAI、模型发布、产品能力演进相关的文章，并说明各自关注点。",
  },
  {
    label: "DeepSeek",
    prompt: "请推荐我博客里和 DeepSeek 相关的文章，并说明每篇文章分别适合关注什么问题。",
  },
  {
    label: "Claude Code",
    prompt: "请推荐我博客里和 Claude Code、AI 编程实践相关的文章，并说明各自适合什么场景。",
  },
  {
    label: "简单设计",
    prompt: "请推荐我博客里和简单设计相关的文章，并总结每篇文章最值得先看的一个要点。",
  },
  {
    label: "敏捷方法",
    prompt: "请推荐我博客里和敏捷方法相关的文章，并说明分别适合团队实践中的哪些问题。",
  },
];

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
    maxInputChars: 200,
    quickTopics: aiQuickTopics,
  },
} as const;

export const POSTS_PER_PAGE = config.posts.perPage;
export const EXCERPT_LENGTH = config.posts.excerptLength;
