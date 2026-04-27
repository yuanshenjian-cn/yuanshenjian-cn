import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAIColumnBySlug, getAIColumns } from "@/lib/columns";
import { getColumnIconBySlug } from "@/components/column-icons";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

interface Props {
  params: Promise<{ column: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const columns = getAIColumns();
  return columns.map((col) => ({ column: col.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { column: slug } = await params;
  const column = getAIColumnBySlug(slug);

  if (!column) {
    return { title: "专栏未找到" };
  }

  return generateListPageSEO(
    `${column.title} | AI 专栏`,
    column.description,
    `${config.site.url}/ai/${column.slug}`,
  );
}

export default async function ColumnPage({ params }: Props) {
  const { column: slug } = await params;
  const column = getAIColumnBySlug(slug);

  if (!column) {
    notFound();
  }

  const latestDate = column.posts.length > 0
    ? new Date(column.posts[0].date)
    : null;
  const Icon = getColumnIconBySlug(column.slug);

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* 面包屑 */}
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/ai" className="hover:text-foreground transition-colors">
            AI 专栏
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{column.title}</span>
        </nav>

        {/* 专栏信息 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            {Icon && <Icon className="w-7 h-7" />}
            <h1 className="text-2xl font-medium tracking-tight">
              {column.title}
            </h1>
          </div>
          <p className="text-muted-foreground">{column.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{column.posts.length} 篇文章</span>
            {latestDate && (
              <span>
                最近更新：
                {latestDate.toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
        </div>

        {/* 专栏导读 */}
        {column.guide && (
          <div className="mb-10 relative pl-6 py-1">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-foreground/20 rounded-full" />
            <p className="text-sm leading-relaxed text-foreground/70">
              {column.guide.intro}
            </p>
            {column.guide.paths && column.guide.paths.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {column.guide.paths.map((path) => (
                  <li key={path.label} className="flex gap-2 text-sm">
                    <span className="font-medium shrink-0 text-foreground/80">
                      {path.label}
                    </span>
                    <span className="text-muted-foreground">
                      — {path.description}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* 文章列表 */}
        <ol className="space-y-0">
            {column.posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/articles/${post.slug}`}
                  className="group block rounded-lg py-3 px-4 -mx-4 transition-colors hover:bg-muted/50"
                >
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                  <h2 className="mt-1 text-xl font-medium tracking-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
      </div>
    </main>
  );
}
