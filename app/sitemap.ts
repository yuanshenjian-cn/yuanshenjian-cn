import { MetadataRoute } from "next";
import { getAllPosts, getPaginatedPosts } from "@/lib/blog";
import { getAIColumns } from "@/lib/columns";
import { config } from "@/lib/config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const columns = getAIColumns();
  const baseUrl = config.site.url;
  const { totalPages } = getPaginatedPosts(1);

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/articles/${post.slug}`,
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

  const paginationUrls = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    url: `${baseUrl}/articles/page/${index + 2}`,
    lastModified: new Date(),
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
    ...paginationUrls,
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
    {
      url: `${baseUrl}/author`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...postUrls,
  ];
}
