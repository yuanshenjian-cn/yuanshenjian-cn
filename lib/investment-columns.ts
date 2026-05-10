import { getPostsByDirectory } from "@/lib/blog";
import type { InvestmentColumnConfig, InvestmentColumnWithPosts } from "@/types/investment";

const INVESTMENT_COLUMNS: InvestmentColumnConfig[] = [
  {
    slug: "beginner-investing",
    title: "小白学投资",
    description: "面向投资初学者，围绕基础认知、常见概念和入门方法展开长期整理。",
    contentDir: "investment/beginner-investing",
    guide: {
      intro: "从投资底层认知、常用指标和阅读方法开始，尽量用朴素语言建立稳定的入门框架。",
      paths: [
        { label: "先打基础", description: "优先阅读投资常识、估值概念和风险边界相关内容。" },
        { label: "再看案例", description: "结合具体市场和公司案例理解概念如何落到真实观察中。" },
      ],
    },
  },
];

export function getInvestmentColumns(): InvestmentColumnWithPosts[] {
  return INVESTMENT_COLUMNS.map((column) => ({
    ...column,
    posts: getPostsByDirectory(column.contentDir),
  }));
}

export function getInvestmentColumnBySlug(slug: string): InvestmentColumnWithPosts | null {
  const column = INVESTMENT_COLUMNS.find((item) => item.slug === slug);

  if (!column) {
    return null;
  }

  return {
    ...column,
    posts: [...getPostsByDirectory(column.contentDir)].reverse(),
  };
}

export function getAllInvestmentColumnConfigs(): InvestmentColumnConfig[] {
  return INVESTMENT_COLUMNS;
}
