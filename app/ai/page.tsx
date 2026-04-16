import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getAIColumns } from "@/lib/columns";
import { getColumnIconBySlug } from "@/components/column-icons";

export const metadata: Metadata = {
  title: "AI 专栏 | 袁慎建",
  description: "AI 效率工程、AI Agent 与 AI Coding 相关的主题系列文章。",
  openGraph: {
    title: "AI 专栏 | 袁慎建",
    description: "AI 效率工程、AI Agent 与 AI Coding 相关的主题系列文章。",
    type: "website",
    images: [
      {
        url: "/images/og-default.webp",
        width: 1200,
        height: 630,
        alt: "AI 专栏",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI 专栏 | 袁慎建",
    description: "AI 效率工程、AI Agent 与 AI Coding 相关的主题系列文章。",
    images: ["/images/og-default.webp"],
  },
};

export default async function AIColumnsPage() {
  const columns = getAIColumns();

  return (
    <main className="py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12">
          <h1 className="text-2xl font-medium tracking-tight mb-3">AI 专栏</h1>
          <p className="text-muted-foreground">
AI 效率工程、AI Agent 与 AI Coding 相关的主题系列文章。
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {columns.map((column) => {
            const latestDate = column.posts.length > 0
              ? new Date(column.posts[column.posts.length - 1].date)
              : null;
            const Icon = getColumnIconBySlug(column.slug);

            return (
              <Link
                key={column.slug}
                href={`/ai/${column.slug}`}
                className="group flex flex-col rounded-xl border p-6 transition-all duration-200 hover:border-foreground/25 hover:shadow-sm"
              >
                {/* Icon */}
                {Icon && <Icon className="w-8 h-8 mb-5" />}

                {/* Title + Description */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold tracking-tight mb-2 group-hover:text-primary transition-colors">
                    {column.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {column.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span>{column.posts.length} 篇文章</span>
                    {latestDate && (
                      <>
                        <span>·</span>
                        <span>
                          {latestDate.toLocaleDateString("zh-CN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
