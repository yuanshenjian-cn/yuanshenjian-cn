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
  {
    slug: "eat-your-way-to-health",
    title: "吃出来的健康",
    description: "从日常食材选择、烹饪方式和饮食习惯出发，用简单可操作的方法把健康吃进门。",
    contentDir: "health/eat-your-way-to-health",
    guide: {
      intro: "聚焦厨房里最常用的食材和做法，不搞复杂理论，只给能立刻上手的判断和搭配建议。",
      paths: [
        { label: "想改善日常用油", description: "从橄榄油选购与使用开始，建立正确的油脂使用习惯。" },
        { label: "想吃得更清爽", description: "关注白灼、凉拌等轻量烹饪方式的搭配技巧。" },
      ],
    },
  },
  {
    slug: "diet-culture",
    title: "饮食文化",
    description: "追溯饮食传统、食材演变和餐桌习俗的文化脉络，从更长的历史尺度理解「怎么吃」这件事。",
    contentDir: "health/diet-culture",
    guide: {
      intro: "不教你怎么吃，而是带你理解一种饮食方式从何而来、靠什么流传至今，以及它能给现代生活什么启发。",
      paths: [
        { label: "对饮食传统好奇", description: "从地中海饮食、传统饮食文化等角度了解饮食背后的历史与人文。" },
        { label: "想理解饮食的底层逻辑", description: "关注饮食模式与健康的关系，不纠结单一营养素。" },
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
