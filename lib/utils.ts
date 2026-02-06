import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 清理 Markdown 内容，移除代码块和格式标记
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
