import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function stripMarkdownCode(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
}

/**
 * 清理 Markdown 内容，返回用于阅读时长和摘要的可见字符字符串。
 * - 去除代码块（```fence```）与行内代码（`code`）
 * - 去除 Markdown 格式标记（# * _ [] () {}）
 * - 去除所有空白字符
 */
export function cleanContent(content: string): string {
  return stripMarkdownCode(content)
    .replace(/[#*_`\[\]\(\)\{\}]/g, "")
    .replace(/\s+/g, "");
}

/**
 * 计算面向前端展示的字数。
 * - 保留 Markdown 链接/图片中的可见文本，丢弃 URL
 * - 不统计标点符号
 * - 去除代码块、行内代码与 Markdown 标记
 */
export function calculateWordCount(content: string): number {
  return stripMarkdownCode(content)
    .replace(/!?\[([^\]]*)\]\((?:[^()\\\n]|\\.|\([^()\\\n]*\))*\)/g, "$1")
    .replace(/[#*_`\[\]\(\)\{\}]/g, "")
    .replace(/[\p{P}]/gu, "")
    .replace(/\s+/g, "")
    .length;
}

/**
 * 计算阅读时间
 */
export function calculateReadingTime(content: string, charactersPerMinute: number): number {
  const cleanText = cleanContent(content);
  const charCount = cleanText.length;
  return Math.max(1, Math.ceil(charCount / charactersPerMinute));
}
