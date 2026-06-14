import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { BackToTop } from "@/components/system/BackToTop";
import { ServiceWorkerRegistration } from "@/components/system/ServiceWorkerRegistration";
import { config } from "@/lib/config";

const inter = localFont({
  src: "./fonts/Inter-Variable.ttf",
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const playfair = localFont({
  src: "./fonts/PlayfairDisplay-Variable.ttf",
  variable: "--font-playfair",
  display: "swap",
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
          <div className="flex-1">{children}</div>
          <Footer />
          <BackToTop />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
