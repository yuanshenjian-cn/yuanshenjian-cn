import type { NextConfig } from "next";

// dev 与生产构建分开输出：next dev 写 .next，next build/export 写 dist。
// 共用同一个目录时，构建会覆盖 dev 正在使用的 manifests 和 webpack chunks，
// 导致运行中的 dev server 出现 routes-manifest.json / vendor-chunks 缺失的 500。
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  distDir: isDev ? ".next" : "dist",
  cleanDistDir: false,
  basePath: "",
  experimental: {
    externalDir: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: "vendor",
              chunks: "all",
              priority: 10,
            },
            mdx: {
              test: /[\\/]node_modules[\\/](@mdx-js|next-mdx-remote|remark|rehype|unified)[\\/]/,
              name: "mdx",
              chunks: "all",
              priority: 5,
            },
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: -10,
            },
          },
        },
      };
    }

    return config;
  },
  compress: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
