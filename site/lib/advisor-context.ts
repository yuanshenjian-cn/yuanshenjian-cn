import type { AdvisorContextValue, AdvisorScene, AIQuickTopic } from "@/types/ai";

interface BuildAdvisorContextInput {
  scene: AdvisorScene;
  title: string;
  domain?: string;
  pageSlug?: string;
  articleSlug?: string;
  quickTopics?: AIQuickTopic[];
}

export function buildAdvisorContext(input: BuildAdvisorContextInput): AdvisorContextValue {
  return {
    scene: input.scene,
    pageTitle: input.title,
    domain: input.domain,
    pageSlug: input.pageSlug,
    articleSlug: input.articleSlug,
    quickTopics: input.quickTopics ?? [],
  };
}

export function defaultAdvisorQuickTopics(scene: AdvisorScene): AIQuickTopic[] {
  if (scene === "article") {
    return [
      { label: "3 行总结这篇文章", prompt: "3 行总结这篇文章" },
      { label: "核心观点是什么", prompt: "这篇文章的核心观点是什么" },
      { label: "适合谁读", prompt: "这篇文章适合谁读" },
      { label: "看完能获得什么", prompt: "看完这篇文章我能获得什么" },
    ];
  }
  if (scene === "author") {
    return [
      { label: "核心工作经历", prompt: "你有哪些核心工作经历" },
      { label: "擅长什么方向", prompt: "你擅长什么方向" },
      { label: "有哪些证书或资质", prompt: "你有哪些证书或资质" },
      { label: "更适合什么岗位", prompt: "你更适合什么岗位" },
    ];
  }
  if (scene === "health" || scene === "health-column") {
    return [
      { label: "介绍一些泡水的文章", prompt: "请推荐一些关于泡水的文章。" },
      { label: "适合什么人群", prompt: "请说明当前栏目内容更适合什么人群。" },
    ];
  }
  if (scene === "investment" || scene === "investment-column") {
    return [
      { label: "这个栏目主要聊什么", prompt: "这个栏目主要关注哪些投资话题？用一两句话帮我快速定位。" },
      { label: "最近有什么变化", prompt: "结合最近的内容，观察名单或市场层面有什么值得注意的变化？" },
      { label: "小白从哪开始看", prompt: "如果我想系统了解投资，从这个栏目里的文章开始，应该按什么顺序看？" },
      { label: "当前重点风险", prompt: "结合栏目内容，当前需要重点关注哪些风险或限制？" },
      { label: "有没有长期方向", prompt: "这个栏目里有没有适合长期跟踪的方向或标的？简单说说理由。" },
    ];
  }
  if (scene === "ai" || scene === "ai-column") {
    return [
      { label: "这个栏目关注什么", prompt: "这个 AI 栏目主要关注哪些方向？用一两句话帮我快速定位。" },
      { label: "最近有什么动态", prompt: "最近 AI 领域有哪些值得跟进的动态或发布？" },
      { label: "小白怎么入门", prompt: "如果我想系统了解 AI，从这个栏目开始应该先看哪几篇？" },
      { label: "AI 编程有推荐吗", prompt: "栏目里关于 AI 编程、AI 辅助开发的内容，有哪些值得先看？" },
      { label: "怎么找某厂商内容", prompt: "我想快速找到关于 OpenAI、DeepSeek、Claude 或 Kimi 的文章，应该怎么筛选？" },
    ];
  }
  return [];
}

export function resolveAdvisorDomainByPath(relativePath: string): string {
  const normalized = relativePath.toLowerCase();
  if (normalized.startsWith("health/")) {
    return "health";
  }
  if (normalized.startsWith("investment/")) {
    return "investment";
  }
  if (normalized.startsWith("swd/ai-coding/")) {
    return "ai";
  }
  return "article";
}
