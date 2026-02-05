import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { ArrowRight, Calendar } from "lucide-react";

export default function Home() {
  const posts = getAllPosts();
  const recentPosts = posts.slice(0, 3);

  return (
    <>
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/images/home/hero-bg.webp')`,
          }}
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        
        {/* Content */}
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-20">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium mb-6 text-foreground drop-shadow-sm">
            你好
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mb-10 max-w-xl mx-auto">
            分享技术知识、生活感悟与个人想法
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors font-medium"
            >
              浏览文章
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/resume"
              className="inline-flex items-center px-6 py-3 bg-background/80 backdrop-blur-sm border border-foreground/20 rounded-md hover:bg-background transition-colors font-medium"
            >
              关于我
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Posts */}
      {recentPosts.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-medium">最新文章</h2>
              <Link
href="/articles"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                查看全部
              </Link>
            </div>

            <div className="space-y-8">
              {recentPosts.map((post) => (
                <article key={post.slug}>
                  <Link href={`/articles/${post.year}/${post.month}/${post.day}/${post.slug}`} className="group block">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="w-4 h-4" />
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString("zh-CN")}
                      </time>
                    </div>
                    <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-2">
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
