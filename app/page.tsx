import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { ArrowRight, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "袁慎建的主页 | Yuan Shenjian's Personal Blog",
  description: "记录思考，分享成长。技术实践、敏捷方法、生活随笔。",
  openGraph: {
    title: "袁慎建的主页 | Yuan Shenjian's Personal Blog",
    description: "记录思考，分享成长。技术实践、敏捷方法、生活随笔。",
    type: "website",
  },
};

export default function Home() {
  const posts = getAllPosts();
  const recentPosts = posts.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/home/hero-bg.webp')`,
          }}
        />
        {/* Overlay Gradient - 更柔和的渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
        
        {/* Content */}
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          {/* 主标题 - 更有质感的排版 */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-tight mb-6 text-foreground">
            记录思考，分享成长
          </h1>
          
          {/* 副标题 - 更简洁的描述 */}
          <p className="text-base md:text-lg text-foreground/80 mb-12 max-w-lg mx-auto leading-relaxed font-light">
            技术实践 · 敏捷方法 · 生活随笔
          </p>
          
          {/* 按钮组 - 更简约的设计 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/articles"
              className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm bg-foreground text-background rounded-full hover:bg-foreground/90 transition-all duration-300"
            >
              探索文章
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center px-5 py-2.5 text-sm text-foreground border border-foreground/30 rounded-full hover:border-foreground/60 hover:bg-foreground/5 transition-all duration-300"
            >
              了解作者
            </Link>
          </div>
        </div>
        
        {/* 底部渐变过渡 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Latest Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-medium text-foreground">最新文章</h2>
              <Link
                href="/articles"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
              </Link>
            </div>

            <div className="space-y-8">
              {recentPosts.map((post) => (
                <article key={post.slug} className="group">
                  <Link href={`/articles/${post.year}/${post.month}/${post.day}/${post.slug}`} className="block">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("zh-CN")}
                      </time>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                      {post.excerpt}
                    </p>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
