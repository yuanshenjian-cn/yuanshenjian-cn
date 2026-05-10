import { Metadata } from "next";
import Link from "next/link";
import { config } from "@/lib/config";
import { generateListPageSEO } from "@/lib/seo-utils";

export const metadata: Metadata = generateListPageSEO(
  "关于",
  "关于博客作者的信息",
  `${config.site.url}/about`,
);

export default function AboutPage() {
  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-medium mb-4">关于我</h1>
        <p className="text-muted-foreground mb-8">
          更详细的信息请查看我的简历页面
        </p>
        <Link
          href="/author"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          查看完整简历
        </Link>
      </div>
    </main>
  );
}
