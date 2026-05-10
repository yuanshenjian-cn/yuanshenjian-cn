import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-6xl font-serif font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">页面未找到</h2>
      <p className="text-muted-foreground mb-8">
        抱歉，您访问的页面不存在。
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
      >
        返回首页
      </Link>
    </div>
  );
}
