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
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrismPlus],
  },
  extension: /\.mdx?$/,
});

export default withMDX(nextConfig);
