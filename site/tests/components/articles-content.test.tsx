import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticlesContent } from "@/components/article/ArticlesContent";
import type { Post } from "@/types/blog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock("@/components/article/Pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/article/ArticleStatsBadge", () => ({
  ArticleStatsBadge: ({ slug }: { slug: string }) => <div data-testid={`stats-${slug}`}>stats-{slug}</div>,
}));

const posts: Post[] = [
  {
    slug: "hello-world",
    year: "2026",
    month: "05",
    day: "10",
    title: "Hello World",
    date: new Date("2026-05-10").toISOString(),
    excerpt: "测试摘要",
    content: "正文内容",
    tags: ["测试"],
    published: true,
    readingTime: 3,
    wordCount: 1234,
    relativePath: "hello-world.mdx",
  },
];

describe("ArticlesContent", () => {
  it("在列表中展示字数、阅读时长和异步统计组件", () => {
    render(<ArticlesContent allPosts={posts} tags={["测试"]} postsPerPage={10} />);

    expect(screen.getByRole("heading", { name: "Hello World" })).toBeInTheDocument();
    expect(screen.getByText("1200+ 字")).toBeInTheDocument();
    expect(screen.getByText("3 分钟")).toBeInTheDocument();
    expect(screen.getByTestId("stats-hello-world")).toBeInTheDocument();
  });
});
