import { describe, it, expect } from "vitest";
import { cleanContent, calculateReadingTime } from "@/lib/utils";

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

  it("should handle empty string", () => {
    const result = cleanContent("");
    expect(result).toBe("");
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
