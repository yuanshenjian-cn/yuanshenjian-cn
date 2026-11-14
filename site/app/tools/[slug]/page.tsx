import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";
import { getAllTools, getToolBySlug, getToolEmbedPath } from "@/lib/tools";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    return { title: "工具未找到" };
  }

  return generateListPageSEO(
    `${tool.title} | 小工具`,
    tool.description,
    `${config.site.url}/tools/${tool.slug}`,
  );
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  // 工具按整屏应用承载，不加额外导航条：返回列表走顶部站点导航
  return (
    <main className="h-[calc(100dvh-3.5rem)]">
      <iframe
        src={getToolEmbedPath(tool.slug)}
        title={tool.title}
        allow="screen-wake-lock"
        className="h-full w-full border-0 bg-background"
      />
    </main>
  );
}
