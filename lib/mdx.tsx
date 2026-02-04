import React from 'react';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrismPlus from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';

export type MDXComponents = Record<string, React.ComponentType<any>>;

const mdxComponents: MDXComponents = {
  h1: (props: any) => <h1 {...props} className="text-3xl font-bold mt-8 mb-4" />,
  h2: (props: any) => <h2 {...props} className="text-2xl font-bold mt-6 mb-3" />,
  h3: (props: any) => <h3 {...props} className="text-xl font-semibold mt-5 mb-2" />,
  h4: (props: any) => <h4 {...props} className="text-lg font-semibold mt-4 mb-2" />,
  p: (props: any) => <p {...props} className="my-4 leading-relaxed" />,
  ul: (props: any) => <ul {...props} className="list-disc list-inside my-4 space-y-2" />,
  ol: (props: any) => <ol {...props} className="list-decimal list-inside my-4 space-y-2" />,
  li: (props: any) => <li {...props} className="my-1" />,
  blockquote: (props: any) => <blockquote {...props} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" />,
  code: (props: any) => <code {...props} className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" />,
  pre: (props: any) => <pre {...props} className="bg-muted p-4 rounded-lg overflow-x-auto my-4" />,
  a: (props: any) => <a {...props} className="text-primary hover:underline" />,
  hr: () => <hr className="my-8 border-border" />,
  table: (props: any) => <table {...props} className="w-full border-collapse my-4" />,
  th: (props: any) => <th {...props} className="border border-border px-4 py-2 text-left font-semibold" />,
  td: (props: any) => <td {...props} className="border border-border px-4 py-2" />,
};

export async function MDXContent({ source }: { source: string }) {
  const { content } = parseMDX(source);

  return (
    <MDXRemote
      source={content}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypePrismPlus],
        },
      }}
    />
  );
}

export function extractFrontmatter(source: string) {
  const { data, content } = matter(source);
  return { data, content };
}

export function parseMDX(source: string) {
  const { data, content } = extractFrontmatter(source);

  return {
    frontmatter: data,
    content,
  };
}

export function isValidMDX(source: string): boolean {
  if (typeof source !== 'string' || source.trim() === '') {
    return false;
  }

  const frontmatterEnd = source.indexOf('---', 3);
  const content = frontmatterEnd > 0 ? source.slice(frontmatterEnd + 3) : source;

  return content.trim().length > 0;
}

export function calculateReadingTime(content: string): number {
  const wordCount = content.split(/\s+/g).length;
  return Math.ceil(wordCount / 200);
}
