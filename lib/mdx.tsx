import React from 'react';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import GitHubSlugger from 'github-slugger';
import { CodeBlock } from '@/components/code-block';


export type MDXComponents = Record<string, React.FC<Record<string, unknown>>>;

interface HeadingProps {
  id?: string;
  children?: React.ReactNode;
}

interface ElementProps {
  children?: React.ReactNode;
  className?: string;
}

interface ImageProps extends ElementProps {
  src?: string;
  alt?: string;
}

const mdxComponents: MDXComponents = {
  h1: ({ id, children }: HeadingProps) => (
    <h1 id={id} className="text-3xl font-bold mt-8 mb-4 scroll-mt-24">{children}</h1>
  ),
  h2: ({ id, children }: HeadingProps) => (
    <h2 id={id} className="text-2xl font-bold mt-6 mb-3 scroll-mt-24">{children}</h2>
  ),
  h3: ({ id, children }: HeadingProps) => (
    <h3 id={id} className="text-xl font-semibold mt-5 mb-2 scroll-mt-24">{children}</h3>
  ),
  h4: ({ id, children }: HeadingProps) => (
    <h4 id={id} className="text-lg font-semibold mt-4 mb-2 scroll-mt-24">{children}</h4>
  ),
  p: ({ children }: ElementProps) => <p className="my-4 leading-relaxed break-words">{children}</p>,
  img: ({ src, alt }: ImageProps) => (
    <img src={src} alt={alt} className="max-w-full h-auto my-4 rounded-lg" />
  ),
  ul: ({ children }: ElementProps) => <ul className="list-disc list-inside my-4 space-y-2">{children}</ul>,
  ol: ({ children }: ElementProps) => <ol className="list-decimal list-inside my-4 space-y-2">{children}</ol>,
  li: ({ children }: ElementProps) => <li className="my-1 break-words">{children}</li>,
  blockquote: ({ children }: ElementProps) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground break-words">{children}</blockquote>
  ),
  pre: ({ children }: ElementProps) => {
    // pre 元素包裹的是代码块，提取 code 子元素传递给 CodeBlock
    return <CodeBlock>{children}</CodeBlock>;
  },
  code: ({ children }: ElementProps) => {
    // 行内代码 - 与代码块保持一致的背景色，不加粗
    return (
      <code className="bg-muted text-slate-800 dark:text-foreground px-1.5 py-0.5 rounded text-sm font-normal font-mono break-all">
        {children}
      </code>
    );
  },
  a: ({ children, href }: ElementProps & { href?: string }) => <a href={href} className="text-primary hover:underline break-all">{children}</a>,
  hr: () => <hr className="my-8 border-border" />,
  table: ({ children }: ElementProps) => <table className="w-full border-collapse my-4">{children}</table>,
  th: ({ children }: ElementProps) => (
    <th className="border border-border px-4 py-2 text-left font-semibold break-words">{children}</th>
  ),
  td: ({ children }: ElementProps) => (
    <td className="border border-border px-4 py-2 break-words">{children}</td>
  ),
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

  try {
    const frontmatterEnd = source.indexOf('---', 3);
    const content = frontmatterEnd > 0 ? source.slice(frontmatterEnd + 3) : source;
    return content.trim().length > 0;
  } catch {
    return false;
  }
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

  let inCodeBlock = false;

  for (const line of lines) {
    // 检测代码块开始/结束
    const codeBlockMatch = line.match(/^(\s*)(`{3,}|~{3,})\s*([a-zA-Z0-9+-]*)?\s*$/);
    
    if (codeBlockMatch) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    // 只在代码块外匹配标题
    if (!inCodeBlock) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = slugger.slug(text);
        
        headings.push({ id, text, level });
      }
    }
  }

  return headings;
}
