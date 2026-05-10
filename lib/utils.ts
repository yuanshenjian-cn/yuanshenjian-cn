import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 清理 Markdown 内容，返回仅含正文可见字符的字符串（用于字数/阅读时长计算）
 * - 去除代码块（```fence```）与行内代码（`code`）
 * - 去除 Markdown 格式标记（# * _ [] () {}）
 * - 去除所有空白字符（按字符数计算，与空格无关，适合中文）
 */
export function cleanContent(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/[#*_`\[\]\(\)\{\}]/g, "")
    .replace(/\s+/g, "");
}

/**
 * 计算阅读时间
 */
export function calculateReadingTime(content: string, charactersPerMinute: number): number {
  const cleanText = cleanContent(content);
  const charCount = cleanText.length;
  return Math.max(1, Math.ceil(charCount / charactersPerMinute));
}
