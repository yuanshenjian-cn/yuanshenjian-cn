import React from 'react';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypePrismPlus from 'rehype-prism-plus';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import GitHubSlugger from 'github-slugger';

export type MDXComponents = Record<string, React.ComponentType<any>>;

const mdxComponents: MDXComponents = {
  h1: (props: any) => {
    const { id, children, ...rest } = props;
    return <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24" {...rest}>{children}</h1>;
  },
  h2: (props: any) => {
    const { id, children, ...rest } = props;
    return <h2 id={id} className="text-2xl font-bold mt-6 mb-3 scroll-mt-24" {...rest}>{children}</h2>;
  },
  h3: (props: any) => {
    const { id, children, ...rest } = props;
    return <h3 id={id} className="text-xl font-semibold mt-5 mb-2 scroll-mt-24" {...rest}>{children}</h3>;
  },
  h4: (props: any) => {
    const { id, children, ...rest } = props;
    return <h4 id={id} className="text-lg font-semibold mt-4 mb-2 scroll-mt-24" {...rest}>{children}</h4>;
  },
  p: (props: any) => <p {...props} className="my-4 leading-relaxed" />,
  ul: (props: any) => <ul {...props} className="list-disc list-inside my-4 space-y-2" />,
  ol: (props: any) => <ol {...props} className="list-decimal list-inside my-4 space-y-2" />,
  li: (props: any) => <li {...props} className="my-1" />,
  blockquote: (props: any) => <blockquote {...props} className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground" />,
  code: (props: any) => <code {...props} className="bg-muted/60 px-1.5 py-0.5 rounded text-sm font-mono" />,
  pre: (props: any) => <pre {...props} className="bg-muted/80 dark:bg-muted p-4 rounded-lg overflow-x-auto my-4" />,
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
          rehypePlugins: [
            rehypeSlug, // 自动生成 id
            rehypePrismPlus
          ],
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

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');
  const slugger = new GitHubSlugger();
  
  // 重置 slugger 以确保每次调用都是独立的
  slugger.reset();

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = slugger.slug(text);
      
      headings.push({ id, text, level });
    }
  }

  return headings;
}
