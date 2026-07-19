import { describe, it, expect } from "vitest";
import { calculateReadingTime, calculateWordCount, cleanContent } from "@/lib/utils";

describe("cleanContent", () => {
  it("should remove code blocks", () => {
    const content = "```javascript\nconst x = 1;\n```\nHello world";
    const result = cleanContent(content);
    expect(result).toBe("Helloworld");
  });

  it("should remove inline code", () => {
    const content = "Use `console.log` to debug";
    const result = cleanContent(content);
    expect(result).toBe("Usetodebug");
  });

  it("should remove markdown syntax", () => {
    const content = "# Title\n**Bold** and *italic*";
    const result = cleanContent(content);
    expect(result).toBe("TitleBoldanditalic");
  });

  it("should keep punctuation for reading-time cleaning", () => {
    const content = "Hello, world!";
    const result = cleanContent(content);
    expect(result).toBe("Hello,world!");
  });

  it("should handle empty string", () => {
    const result = cleanContent("");
    expect(result).toBe("");
  });
});

describe("calculateWordCount", () => {
  it("should exclude punctuation from word count", () => {
    const content = "你好，世界！Hello, world!";
    const result = calculateWordCount(content);
    expect(result).toBe(14);
  });

  it("should keep visible link text and exclude url", () => {
    const content = "查看[官方文档](https://example.com/docs_(v2))";
    const result = calculateWordCount(content);
    expect(result).toBe(6);
  });

  it("should not treat plain bracket text as markdown link", () => {
    const content = "这里有普通文本 ](补充说明) 继续";
    const result = calculateWordCount(content);
    expect(result).toBe(13);
  });
});

describe("calculateReadingTime", () => {
  it("should calculate reading time correctly", () => {
    // 600 characters / 600 per minute = 1 minute
    const content = "a".repeat(600);
    const result = calculateReadingTime(content, 600);
    expect(result).toBe(1);
  });

  it("should return at least 1 minute", () => {
    const content = "short";
    const result = calculateReadingTime(content, 600);
    expect(result).toBe(1);
  });

  it("should round up to nearest minute", () => {
    // 900 characters / 600 per minute = 1.5 -> 2 minutes
    const content = "a".repeat(900);
    const result = calculateReadingTime(content, 600);
    expect(result).toBe(2);
  });
});
