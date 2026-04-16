import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getAIColumns } from "@/lib/columns";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const columns = getAIColumns();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com";

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/articles/${post.year}/${post.month}/${post.day}/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const columnUrls = columns.map((col) => ({
    url: `${baseUrl}/ai/${col.slug}`,
    lastModified: col.posts.length > 0 ? new Date(col.posts[col.posts.length - 1].date) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/ai`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...columnUrls,
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...postUrls,
  ];
}
