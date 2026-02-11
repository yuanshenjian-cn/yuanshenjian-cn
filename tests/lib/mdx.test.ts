import { describe, it, expect } from "vitest";
import { extractHeadings, isValidMDX, extractFrontmatter } from "@/lib/mdx";

describe("extractHeadings", () => {
  it("should extract headings from markdown", () => {
    const content = `
# Heading 1
## Heading 2
### Heading 3
`;
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(3);
    expect(headings[0]).toEqual({ id: "heading-1", text: "Heading 1", level: 1 });
    expect(headings[1]).toEqual({ id: "heading-2", text: "Heading 2", level: 2 });
    expect(headings[2]).toEqual({ id: "heading-3", text: "Heading 3", level: 3 });
  });

  it("should ignore headings in code blocks", () => {
    const content = `
## Real Heading
\`\`\`
# Code Comment
\`\`\`
`;
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(1);
    expect(headings[0].text).toBe("Real Heading");
  });

  it("should handle duplicate headings with unique ids", () => {
    const content = `
## Same Title
## Same Title
`;
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(2);
    expect(headings[0].id).toBe("same-title");
    expect(headings[1].id).toBe("same-title-1");
  });

  it("should return empty array for no headings", () => {
    const content = "Just some text without headings.";
    const headings = extractHeadings(content);
    expect(headings).toHaveLength(0);
  });
});

describe("isValidMDX", () => {
  it("should return true for valid MDX", () => {
    expect(isValidMDX("---\ntitle: Test\n---\nContent")).toBe(true);
    expect(isValidMDX("Just content")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(isValidMDX("")).toBe(false);
    expect(isValidMDX("   ")).toBe(false);
  });

  it("should return false for non-string input", () => {
    expect(isValidMDX(null as unknown as string)).toBe(false);
    expect(isValidMDX(undefined as unknown as string)).toBe(false);
    expect(isValidMDX(123 as unknown as string)).toBe(false);
  });
});

describe("extractFrontmatter", () => {
  it("should extract frontmatter from MDX", () => {
    const source = `---
title: Test Post
date: 2024-01-01
tags: ["test"]
---
Content here`;

    const { data, content } = extractFrontmatter(source);
    expect(data.title).toBe("Test Post");
    // gray-matter 会自动将日期字符串解析为 Date 对象
    expect(data.date).toBeInstanceOf(Date);
    expect(data.tags).toEqual(["test"]);
    expect(content.trim()).toBe("Content here");
  });

  it("should handle content without frontmatter", () => {
    const source = "Just content without frontmatter";
    const { data, content } = extractFrontmatter(source);
    expect(data).toEqual({});
    expect(content).toBe(source);
  });
});
