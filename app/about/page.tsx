import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "关于 | 袁慎建",
  description: "关于博客作者的信息",
  openGraph: {
    title: "关于 | 袁慎建",
    description: "关于博客作者的信息",
    type: "profile",
    images: [
      {
        url: "/images/og-default.webp",
        width: 1200,
        height: 630,
        alt: "关于袁慎建",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "关于 | 袁慎建",
    description: "关于博客作者的信息",
    images: ["/images/og-default.webp"],
  },
};

export default function AboutPage() {
  return (
    <main className="py-12 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-2xl font-medium mb-4">关于我</h1>
        <p className="text-muted-foreground mb-8">
          更详细的信息请查看我的简历页面
        </p>
        <Link
          href="/resume"
          className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          查看完整简历
        </Link>
      </div>
    </main>
  );
}
