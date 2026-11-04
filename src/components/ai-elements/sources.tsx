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
      className={cn(
        'mt-2 flex flex-wrap gap-1.5 pt-0.5 max-h-36 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-[#383838] pr-1',
        className
      )}
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
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-left text-[11px] cursor-pointer max-w-[220px] group border shrink-0',
        'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 hover:text-zinc-950',
        'dark:bg-[#1f1f1f] dark:border-[#383838] dark:text-[#d4d4ce] dark:hover:bg-[#282828] dark:hover:border-brand-500/40 dark:hover:text-white',
        className
      )}
      title={citation.snippet ? `"${citation.snippet}"` : citation.sourceTitle}
      {...props}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded font-mono text-[9px] font-bold shrink-0 bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
        {citation.citationNumber}
      </span>
      <span className="truncate font-medium text-[10.5px] text-zinc-900 dark:text-[#f4f4f2]">
        {citation.sourceTitle}
      </span>
      {citation.pageNumber && (
        <span className="text-[9px] text-zinc-500 dark:text-[#9a9a94] font-mono shrink-0">
          p.{citation.pageNumber}
        </span>
      )}
      <ExternalLink className="w-2.5 h-2.5 text-zinc-400 dark:text-[#9a9a94] opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
    </button>
  );
}
