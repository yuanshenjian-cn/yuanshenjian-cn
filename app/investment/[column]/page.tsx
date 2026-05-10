import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { getInvestmentColumnBySlug, getInvestmentColumns } from "@/lib/investment-columns";

export const dynamicParams = false;

interface Props {
  params: Promise<{ column: string }>;
}

export function generateStaticParams() {
  const columns = getInvestmentColumns();
  return columns.length > 0 ? columns.map((column) => ({ column: column.slug })) : [{ column: "__empty__" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { column: slug } = await params;
  const column = getInvestmentColumnBySlug(slug);

  if (!column) {
    return { title: "投资专栏 | YSJ" };
  }

  return {
    title: `${column.title} | YSJ`,
    description: column.description,
  };
}

export default async function InvestmentColumnPage({ params }: Props) {
  const { column: slug } = await params;

  if (slug === "__empty__") {
    notFound();
  }

  const column = getInvestmentColumnBySlug(slug);
  if (!column) {
    notFound();
  }

  const latestDate = column.posts.length > 0 ? new Date(column.posts[0].date) : null;

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/investment" className="hover:text-foreground transition-colors">
            投资栏目
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{column.title}</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-2xl font-medium tracking-tight">{column.title}</h1>
          <p className="mt-3 text-muted-foreground">{column.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span>{column.posts.length} 篇文章</span>
            {latestDate ? (
              <span>
                最近更新：
                {latestDate.toLocaleDateString("zh-CN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            ) : null}
          </div>
        </div>

        {column.guide ? (
          <div className="mb-10 relative pl-6 py-1">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-foreground/20 rounded-full" />
            <p className="text-sm leading-relaxed text-foreground/70">{column.guide.intro}</p>
            {column.guide.paths && column.guide.paths.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {column.guide.paths.map((item) => (
                  <li key={item.label} className="flex gap-2 text-sm">
                    <span className="font-medium shrink-0 text-foreground/80">{item.label}</span>
                    <span className="text-muted-foreground">- {item.description}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {column.posts.length > 0 ? (
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
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            这个专栏还没有公开文章，后续会持续补充。
          </p>
        )}
      </div>
    </main>
  );
}
