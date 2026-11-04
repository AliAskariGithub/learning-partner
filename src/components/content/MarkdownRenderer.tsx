'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <article
      className={cn(
        'prose dark:prose-invert max-w-none font-serif leading-relaxed text-sm sm:text-base text-foreground/90',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h2
                id={id}
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-10 mb-4 pb-2 border-b border-border/60 scroll-mt-24"
              >
                <a href={`#${id}`} className="hover:text-brand-500 transition-colors group">
                  {children}
                  <span className="opacity-0 group-hover:opacity-100 ml-2 text-brand-500 text-sm">#</span>
                </a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children);
            const id = slugify(text);
            return (
              <h3
                id={id}
                className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground mt-6 mb-3 scroll-mt-24"
              >
                <a href={`#${id}`} className="hover:text-brand-500 transition-colors group">
                  {children}
                </a>
              </h3>
            );
          },
          p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1.5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => {
            const isInternal = href?.startsWith('/') || href?.startsWith('#');
            if (isInternal && href && !href.startsWith('#')) {
              return (
                <Link
                  href={href}
                  className="text-brand-600 dark:text-brand-400 font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target={href?.startsWith('#') ? undefined : '_blank'}
                rel={href?.startsWith('#') ? undefined : 'noopener noreferrer'}
                className="text-brand-600 dark:text-brand-400 font-medium underline underline-offset-4 hover:opacity-80 transition-opacity"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-brand-500/60 bg-surface/60 pl-4 py-2 pr-3 my-4 italic rounded-r-lg text-muted-foreground">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 border border-border rounded-xl">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-surface border-b border-border font-display font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-surface-raised/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="p-3 text-foreground font-display font-semibold">{children}</th>,
          td: ({ children }) => <td className="p-3 text-muted-foreground align-top">{children}</td>,
          code: ({ className: codeClassName, children }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-surface border border-border text-xs font-mono text-brand-600 dark:text-brand-400">
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-4 rounded-xl bg-surface border border-border text-xs font-mono overflow-x-auto my-4 text-foreground">
                <code>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}

