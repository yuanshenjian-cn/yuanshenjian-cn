import { getPostsByDirectory } from "@/lib/blog";
import type { HealthColumnConfig, HealthColumnWithPosts } from "@/types/health";

const HEALTH_COLUMNS: HealthColumnConfig[] = [
  {
    slug: "drink-your-way-to-health",
    title: "喝出来的健康",
    description: "围绕日常饮品选择、饮水习惯和常见健康饮料误区，整理一套可长期执行的轻量健康方法。",
    contentDir: "health/drink-your-way-to-health",
    guide: {
      intro: "从最常见、最容易每天重复执行的喝水和饮品选择入手，先建立低负担的健康习惯，再逐步扩展到饮食与运动相关内容。",
      paths: [
        { label: "刚开始关注健康", description: "先看最基础的饮水、咖啡、茶和含糖饮料选择原则。" },
        { label: "想减少踩坑", description: "重点看常见饮品误区、营销话术和高频反直觉问题。" },
      ],
    },
  },
];

export function getHealthColumns(): HealthColumnWithPosts[] {
  return HEALTH_COLUMNS.map((column) => ({
    ...column,
    posts: getPostsByDirectory(column.contentDir),
  }));
}

export function getHealthColumnBySlug(slug: string): HealthColumnWithPosts | null {
  const column = HEALTH_COLUMNS.find((item) => item.slug === slug);

  if (!column) {
    return null;
  }

  return {
    ...column,
    posts: [...getPostsByDirectory(column.contentDir)].reverse(),
  };
}

export function getAllHealthColumnConfigs(): HealthColumnConfig[] {
  return HEALTH_COLUMNS;
}
