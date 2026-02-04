import type { NextConfig } from "next";
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypePrismPlus from 'rehype-prism-plus';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'dist',
  basePath: '',
  images: {
    unoptimized: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  // 优化打包配置
  webpack: (config, { isServer }) => {
    // 优化 chunk 分割
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 将大型库单独打包
            vendor: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
            // MDX 相关库
            mdx: {
              test: /[\\/]node_modules[\\/](@mdx-js|next-mdx-remote|remark|rehype|unified)[\\/]/,
              name: 'mdx',
              chunks: 'all',
              priority: 5,
            },
            // 其他 node_modules
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: -10,
            },
          },
        },
      };
    }
    return config;
  },
  // 压缩配置
  compress: true,
  // 启用生产环境优化
  productionBrowserSourceMaps: false,
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrismPlus],
  },
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
