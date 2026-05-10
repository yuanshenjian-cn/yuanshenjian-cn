import { MetadataRoute } from "next";
import { getAllPosts, getPaginatedPosts } from "@/lib/blog";
import { getAIColumns } from "@/lib/columns";
import { getAllBriefings, getBriefingArchives } from "@/lib/briefings";
import { config } from "@/lib/config";
import { getInvestmentColumns } from "@/lib/investment-columns";
import { getAllInvestmentBriefings, getInvestmentBriefingArchives } from "@/lib/investment-briefings";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const columns = getAIColumns();
  const briefings = getAllBriefings();
  const briefingArchives = getBriefingArchives();
  const investmentColumns = getInvestmentColumns();
  const investmentBriefings = getAllInvestmentBriefings();
  const investmentBriefingArchives = getInvestmentBriefingArchives();
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

  const briefingUrls = briefings.map((briefing) => ({
    url: `${baseUrl}${briefing.url}`,
    lastModified: new Date(briefing.date),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const briefingArchiveUrls = briefingArchives.map((archive) => ({
    url: `${baseUrl}${archive.url}`,
    lastModified: new Date(`${archive.endDate}T00:00:00.000Z`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const investmentColumnUrls = investmentColumns.map((column) => ({
    url: `${baseUrl}/investment/${column.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const investmentBriefingUrls = investmentBriefings.map((briefing) => ({
    url: `${baseUrl}${briefing.url}`,
    lastModified: new Date(briefing.date),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const investmentBriefingArchiveUrls = investmentBriefingArchives.map((archive) => ({
    url: `${baseUrl}${archive.url}`,
    lastModified: new Date(`${archive.endDate}T00:00:00.000Z`),
    changeFrequency: "monthly" as const,
    priority: 0.6,
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
    {
      url: `${baseUrl}/ai/daily-briefings`,
      lastModified: briefings.length > 0 ? new Date(briefings[0].date) : new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/ai/daily-briefings/archive`,
      lastModified: briefings.length > 0 ? new Date(briefings[0].date) : new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/investment`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/investment/coverage`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/investment/daily-briefings`,
      lastModified: investmentBriefings.length > 0 ? new Date(investmentBriefings[0].date) : new Date(),
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/investment/daily-briefings/archive`,
      lastModified: investmentBriefings.length > 0 ? new Date(investmentBriefings[0].date) : new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    ...briefingArchiveUrls,
    ...briefingUrls,
    ...columnUrls,
    ...investmentBriefingArchiveUrls,
    ...investmentBriefingUrls,
    ...investmentColumnUrls,
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
