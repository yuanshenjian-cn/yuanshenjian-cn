import Link from "next/link";
import Image from "next/image";
import { getAllPosts, getAllTags } from "@/lib/blog";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-sm text-muted-foreground">
              © {currentYear}{" "}
              <Link href="/" className="hover:text-foreground transition-colors">
                Yuan Shenjian
              </Link>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {posts.length} 篇文章 · {tags.length} 个标签
            </p>
          </div>
          <div className="w-12 h-12 bg-background rounded border p-1 flex-shrink-0">
            <Image
              src="/images/resume/ysj-qrcode.jpg"
              alt="微信公众号"
              width={48}
              height={48}
              className="w-full h-full object-cover rounded"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
