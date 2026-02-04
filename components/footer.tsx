import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="font-serif text-lg font-semibold text-foreground"
            >
              博客
            </Link>
            <span className="text-sm text-muted-foreground">
              分享想法与故事
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>© 2026</span>
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
              首页
            </Link>
            <Link
              href="/blog"
              className="hover:text-foreground transition-colors"
            >
              博客
            </Link>
            <Link
              href="/about"
              className="hover:text-foreground transition-colors"
            >
              关于
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
