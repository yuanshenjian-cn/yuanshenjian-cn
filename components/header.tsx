import Link from "next/link";
import { HeaderClient } from "./header-client";
import { getPostsForSearch } from "@/lib/blog";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  // { href: "/about", label: "关于" },
  { href: "/resume", label: "简历" },
];

export async function Header() {
  const posts = getPostsForSearch();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="group relative"
        >
          <span className="text-xl font-serif font-medium tracking-[0.12em] bg-gradient-to-br from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent transition-all duration-300 group-hover:via-foreground group-hover:to-foreground/80">
            YSJ
          </span>
          <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gradient-to-r from-transparent via-foreground/50 to-transparent transition-all duration-300 group-hover:w-full"></span>
        </Link>

        <HeaderClient navItems={navItems} posts={posts} />
      </div>
    </header>
  );
}
