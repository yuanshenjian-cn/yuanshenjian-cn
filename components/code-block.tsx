"use client";

import { useState, useCallback, ReactNode, isValidElement } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children: ReactNode;
  className?: string;
}

interface ElementProps {
  children?: ReactNode;
  className?: string;
}

/**
 * 从 React children 递归提取纯文本
 */
function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === "string") {
    return children;
  }
  
  if (typeof children === "number") {
    return String(children);
  }
  
  if (Array.isArray(children)) {
    return children.map(extractTextFromChildren).join("");
  }
  
  if (isValidElement(children)) {
    const props = children.props as ElementProps;
    return extractTextFromChildren(props.children);
  }
  
  return "";
}

/**
 * 为代码添加行号
 */
function addLineNumbers(code: string): ReactNode {
  const lines = code.split("\n");
  
  // 如果最后一行是空的，移除它
  if (lines[lines.length - 1] === "") {
    lines.pop();
  }
  
  return (
    <div className="flex">
      {/* 行号列 */}
      <div 
        className="select-none text-right pr-4 border-r border-slate-300 dark:border-border/30 text-slate-400 dark:text-muted-foreground/50 text-sm leading-6"
        aria-hidden="true"
      >
        {lines.map((_, i) => (
          <div key={i} className="h-6">
            {i + 1}
          </div>
        ))}
      </div>
      
      {/* 代码列 */}
      <div className="flex-1 overflow-x-auto pl-4">
        <code className="text-sm leading-6">
          {lines.map((line, i) => (
            <div key={i} className="h-6 whitespace-pre">
              {line || "\u00A0"}
            </div>
          ))}
        </code>
      </div>
    </div>
  );
}

export function CodeBlock({ children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  // 提取代码文本
  const codeText = extractTextFromChildren(children);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  }, [codeText]);

  return (
    <div className="relative group">
      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 p-2 rounded-md bg-white/80 dark:bg-muted/80 text-slate-600 dark:text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white dark:hover:bg-muted hover:text-slate-900 dark:hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
        aria-label={copied ? "已复制" : "复制代码"}
        title={copied ? "已复制!" : "复制代码"}
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
      
      {/* 代码块内容 */}
      <pre className="bg-muted dark:bg-muted text-slate-800 dark:text-foreground border border-slate-200 dark:border-border p-4 pt-10 rounded-lg overflow-x-auto mt-4 mb-8 max-w-full text-sm relative">
        {isValidElement(children) ? (
          // 提取 code 元素的文本并添加行号
          addLineNumbers(extractTextFromChildren(children))
        ) : (
          children
        )}
      </pre>
    </div>
  );
}
