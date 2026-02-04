import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/blog";

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-center">
          博客文章
        </h1>
        <p className="text-muted-foreground text-center mb-12">
          分享技术见解、生活感悟与创意想法
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <span className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-full">
              全部
            </span>
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-8">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无文章
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.slug}
                className="group border-b border-border pb-8 last:border-0"
              >
                <Link href={`/blog/${post.slug}`} className="block">
                  <h2 className="text-2xl font-serif font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <time>{new Date(post.date).toLocaleDateString("zh-CN")}</time>
                    <span>·</span>
                    <span>{post.readingTime} 分钟阅读</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.excerpt}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-muted rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}