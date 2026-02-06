import Link from "next/link";
import Image from "next/image";
import { Rss } from "lucide-react";
import { getAllPosts, getAllTags } from "@/lib/blog";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <footer className="border-t border-border/50 mt-auto">
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 左侧信息 */}
          <div className="flex items-center gap-4 text-xs">
            <Link 
              href="/" 
              className="text-foreground/40 hover:text-foreground transition-colors"
            >
              Yuan Shenjian
            </Link>
            <span className="text-foreground/40">
              © {currentYear}
            </span>
            <span className="text-foreground/30">·</span>
            <span className="text-foreground/40">
              {posts.length} 篇 · {tags.length} 标签
            </span>
            <span className="text-foreground/30">·</span>
            <a 
              href="/feed" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-foreground/40 hover:text-foreground transition-colors"
              aria-label="RSS 订阅"
            >
              <Rss className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">订阅</span>
            </a>
          </div>
          
          {/* 右侧二维码和指引 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-foreground/40">
              扫码关注作者
            </span>
            <div className="w-[50px] h-[50px] rounded-lg overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
              <Image
                src="/images/resume/ysj-qrcode.webp"
                alt="微信公众号二维码"
                width={50}
                height={50}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
