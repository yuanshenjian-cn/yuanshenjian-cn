import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { BackToTop } from "@/components/back-to-top";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { config } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // 使用 swap 策略，避免字体加载阻塞渲染
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap", // 使用 swap 策略
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(config.site.url),
  title: "袁慎建的主页 | Yuan Shenjian's Personal Blog",
  description: "分享技术知识、生活感悟与个人想法",
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": "/feed",
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  // PWA 相关配置
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "YSJ Blog",
  },
  // 添加性能优化相关的 meta 标签
  other: {
    "color-scheme": "dark light",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans min-h-screen flex flex-col">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <BackToTop />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
