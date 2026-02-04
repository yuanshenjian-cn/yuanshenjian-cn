import { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于 | 个人博客",
  description: "关于博客作者的信息",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8 text-center">
          关于我
        </h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="bg-gradient-to-br from-muted/50 to-muted rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">你好！</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              欢迎来到我的个人博客。这里是我分享技术见解、生活感悟和创意想法的空间。
            </p>
          </div>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">关于这个博客</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              这个博客使用现代 Web 技术构建，包括 Next.js、React、Tailwind CSS 和 MDX。
              它支持响应式设计、深色模式和静态生成，确保在各种设备上都能提供出色的阅读体验。
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">联系我</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              如果你有任何问题或想法想要交流，欢迎通过以下方式联系我：
            </p>
            <div className="flex gap-4">
              <a
                href="mailto:hello@example.com"
                className="text-primary hover:underline"
              >
                电子邮件
              </a>
              <span className="text-muted-foreground">·</span>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}