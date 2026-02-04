import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6 animate-fade-in">
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground">
          个人博客
        </h1>
        <p className="text-xl text-muted-foreground font-light">
          Personal Blog
        </p>
        <p className="text-muted-foreground">
          A beautiful space for thoughts, ideas, and stories.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/blog"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            浏览文章
          </Link>
          <Link
            href="/about"
            className="px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            关于我
          </Link>
        </div>
      </div>
    </main>
  );
}
