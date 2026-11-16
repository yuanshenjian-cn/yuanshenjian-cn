import type { NextConfig } from "next";

// output: "export" 且 distDir 不是 .next 时，Next 会把 distDir 当作最终导出目录，
// 内部编译产物仍然写入 .next。因此 dev 必须使用独立的 .next-dev，
// 否则 next dev 与 next build 会同时读写 .next，dev 写入的 prerender 路由会污染构建导出。
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  distDir: isDev ? ".next-dev" : "dist",
  cleanDistDir: true,
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
