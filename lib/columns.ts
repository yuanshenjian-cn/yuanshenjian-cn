import { getPostsByDirectory } from "@/lib/blog";
import type { Post } from "@/types/blog";

export interface ColumnReadingPath {
  label: string;
  description: string;
}

export interface ColumnGuide {
  intro: string;
  paths?: ColumnReadingPath[];
}

export interface ColumnConfig {
  slug: string;
  title: string;
  description: string;
  contentDir: string;
  guide?: ColumnGuide;
}

export interface ColumnWithPosts extends ColumnConfig {
  posts: Post[];
}

export interface ColumnContext {
  column: ColumnConfig;
  currentIndex: number;
  totalPosts: number;
  prev: Post | null;
  next: Post | null;
}

const AI_COLUMNS: ColumnConfig[] = [
  {
    slug: "claudecode",
    title: "Claude Code",
    description:
      "从入门到进阶，系统整理 Claude Code 的工作流、记忆与自动化实践。",
    contentDir: "swd/ai-coding/claudecode",
    guide: {
      intro:
        "共 10 篇，从心智模型到高阶自动化，系统掌握 Claude Code 的工作流、扩展机制与实战技巧。前 8 篇为主线系列，后 2 篇为专题补充。",
      paths: [
        {
          label: "赶时间",
          description: "直接从第 2 篇开始上手，遇到问题再回头翻",
        },
        {
          label: "系统学习",
          description: "按 1 → 8 顺序阅读主线，第 9、10 篇随时补充",
        },
        {
          label: "有 AI 编程经验",
          description: "1 → 4 → 5 → 7，快速掌握差异化能力",
        },
        {
          label: "DevOps / 自动化方向",
          description: "1 → 6 → 7 → 8，聚焦权限与自动化",
        },
      ],
    },
  },
  {
    slug: "opencode",
    title: "OpenCode",
    description:
      "围绕 OpenCode 的安装配置、Agent 使用与进阶实践展开的系列专栏。",
    contentDir: "swd/ai-coding/opencode",
    guide: {
      intro:
        "共 9 篇，从零上手到 Oh My OpenCode 高阶配置，涵盖基础入门、Agent 实践与多 orchestrator 架构探索。",
      paths: [
        {
          label: "新手入门",
          description: "从第 1 篇开始，依序阅读前 3 篇",
        },
        {
          label: "快速参考",
          description: "直接翻阅 Agent / Categories 速查手册",
        },
        {
          label: "深度进阶",
          description: "3 → 9，掌握选型思路与 TUI、Agent 配置体系",
        },
        {
          label: "Oh My OpenCode 玩家",
          description: "5 → 6 → 7 → 8，探索多 orchestrator 架构",
        },
      ],
    },
  },
];

/**
 * 获取所有有已发布文章的 AI 专栏
 */
export function getAIColumns(): ColumnWithPosts[] {
  return AI_COLUMNS.map((col) => ({
    ...col,
    posts: getPostsByDirectory(col.contentDir),
  })).filter((col) => col.posts.length > 0);
}

/**
 * 根据 slug 获取单个 AI 专栏及其文章
 * 空专栏（无已发布文章）返回 null
 */
export function getAIColumnBySlug(slug: string): ColumnWithPosts | null {
  const col = AI_COLUMNS.find((c) => c.slug === slug);
  if (!col) return null;

  const posts = getPostsByDirectory(col.contentDir);
  if (posts.length === 0) return null;

  return { ...col, posts: [...posts].reverse() };
}

/**
 * 若文章属于某个 AI 专栏，返回专栏上下文（位置、上下篇）
 * 不属于任何专栏则返回 null
 */
export function getColumnContextByPost(post: Post): ColumnContext | null {
  for (const col of AI_COLUMNS) {
    const prefix = col.contentDir.endsWith("/")
      ? col.contentDir
      : `${col.contentDir}/`;
    if (post.relativePath.startsWith(prefix)) {
      const posts = getPostsByDirectory(col.contentDir);
      const currentIndex = posts.findIndex(
        (p) =>
          p.slug === post.slug &&
          p.year === post.year &&
          p.month === post.month &&
          p.day === post.day,
      );

      if (currentIndex === -1) return null;

      return {
        column: col,
        currentIndex,
        totalPosts: posts.length,
        prev: currentIndex > 0 ? posts[currentIndex - 1] : null,
        next: currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null,
      };
    }
  }
  return null;
}
