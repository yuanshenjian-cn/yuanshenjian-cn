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
      { label: "先从哪里开始看", prompt: "请告诉我应该先从哪里开始看。" },
      { label: "适合什么人群", prompt: "请说明当前栏目内容更适合什么人群。" },
    ];
  }
  if (scene === "investment" || scene === "investment-column") {
    return [
      { label: "重点关注什么", prompt: "请告诉我最值得优先关注的要点。" },
      { label: "有哪些风险提醒", prompt: "请总结需要注意的风险和限制。" },
      { label: "小白如何学投资", prompt: "请推荐适合小白学习的文章。" },
    ];
  }
  if (scene === "ai" || scene === "ai-column") {
    return [
      { label: "怎么阅读这一页", prompt: "请结合当前页面内容，给我一个快速阅读顺序。" },
      { label: "适合什么问题", prompt: "请结合当前页面内容，说明这组内容更适合解决什么问题。" },
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
