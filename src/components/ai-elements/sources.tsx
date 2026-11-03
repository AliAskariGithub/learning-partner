'use client';

import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, ExternalLink } from 'lucide-react';
import { Citation } from '@/db/schema';

export interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export function Sources({ className, defaultOpen = false, children, ...props }: SourcesProps) {
  return (
    <Collapsible
      defaultOpen={defaultOpen}
      className={cn('not-prose mb-3 text-xs text-zinc-600 dark:text-[#9a9a94]', className)}
      {...props}
    >
      {children}
    </Collapsible>
  );
}

export interface SourcesTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
}

export function SourcesTrigger({
  count,
  className,
  children,
  ...props
}: SourcesTriggerProps) {
  if (count <= 0) return null;

  return (
    <CollapsibleTrigger
      className={cn(
        'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs text-xs font-display font-medium border',
        'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900',
        'dark:bg-[#1f1f1f] dark:text-[#a0a09a] dark:border-[#383838] dark:hover:bg-[#282828] dark:hover:text-[#f4f4f2]',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <BookOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300" />
          <span>Used {count} {count === 1 ? 'source' : 'sources'}</span>
          <ChevronDown className="w-3 h-3 text-zinc-400 dark:text-[#9a9a94] transition-transform duration-200 group-data-[state=open]:rotate-180 group-aria-expanded:rotate-180" />
        </>
      )}
    </CollapsibleTrigger>
  );
}

export interface SourcesContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function SourcesContent({ className, children, ...props }: SourcesContentProps) {
  return (
    <CollapsibleContent
      className={cn('mt-2.5 flex flex-wrap gap-2 pt-1', className)}
      {...props}
    >
      {children}
    </CollapsibleContent>
  );
}

export interface SourceProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  citation: Citation;
  onCitationClick?: (citation: Citation) => void;
}

export function Source({
  citation,
  onCitationClick,
  className,
  children,
  ...props
}: SourceProps) {
  return (
    <button
      type="button"
      onClick={() => onCitationClick?.(citation)}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all text-left text-xs cursor-pointer shadow-xs max-w-sm group border',
        'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-950',
        'dark:bg-[#1f1f1f] dark:border-[#383838] dark:text-[#d4d4ce] dark:hover:bg-[#282828] dark:hover:border-brand-500/40 dark:hover:text-white',
        className
      )}
      title={citation.snippet ? `"${citation.snippet}"` : citation.sourceTitle}
      {...props}
    >
      <span className="flex items-center justify-center w-4 h-4 rounded-md font-mono text-[10px] font-bold shrink-0 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
        {citation.citationNumber}
      </span>
      <span className="truncate font-medium text-[11px] text-zinc-900 dark:text-[#f4f4f2]">
        {citation.sourceTitle}
      </span>
      {citation.pageNumber && (
        <span className="text-[10px] text-zinc-500 dark:text-[#9a9a94] font-mono shrink-0">
          p. {citation.pageNumber}
        </span>
      )}
      <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-[#9a9a94] opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
    </button>
  );
}
