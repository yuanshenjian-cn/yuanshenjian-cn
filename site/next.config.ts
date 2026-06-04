import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: "dist",
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
