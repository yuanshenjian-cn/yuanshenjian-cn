import Link from "next/link";
import { HeaderClient } from "./header-client";
import { getAllPosts } from "@/lib/blog";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/articles", label: "文章" },
  // { href: "/about", label: "关于" },
  { href: "/resume", label: "简历" },
];

export async function Header() {
  const posts = getAllPosts();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="hover:opacity-70 transition-opacity"
        >
          <img
            src="/icons/icon-128x128.png"
            alt="YSJ Blog"
            width={28}
            height={28}
            className="w-7 h-7 rounded-sm"
          />
        </Link>

        <HeaderClient navItems={navItems} posts={posts} />
      </div>
    </header>
  );
}
