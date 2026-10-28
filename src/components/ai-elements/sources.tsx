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
      className={cn('not-prose mb-3 text-xs text-[#9a9a94]', className)}
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
  return (
    <CollapsibleTrigger
      className={cn(
        'group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#303030] text-[#9a9a94] hover:text-[#f4f4f2] border border-[#383838] transition-all cursor-pointer shadow-sm text-xs font-display font-medium',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <BookOpen className="w-3.5 h-3.5 text-brand-400 group-hover:text-brand-300" />
          <span>Used {count} source{count === 1 ? '' : 's'}</span>
          <ChevronDown className="w-3 h-3 text-[#9a9a94] transition-transform duration-200 group-data-[state=open]:rotate-180 group-aria-expanded:rotate-180" />
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
        'flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#303030] border border-[#3a3a3a] hover:border-brand-500/50 text-[#d4d4ce] hover:text-white transition-all text-left text-xs cursor-pointer shadow-sm max-w-sm group',
        className
      )}
      title={citation.snippet ? `"${citation.snippet}"` : citation.sourceTitle}
      {...props}
    >
      <span className="flex items-center justify-center w-4 h-4 rounded-md bg-brand-500/20 text-brand-300 font-mono text-[10px] font-bold shrink-0">
        {citation.citationNumber}
      </span>
      <span className="truncate font-medium text-[11px] text-[#f4f4f2]">
        {citation.sourceTitle}
      </span>
      {citation.pageNumber && (
        <span className="text-[10px] text-[#9a9a94] font-mono shrink-0">
          p. {citation.pageNumber}
        </span>
      )}
      <ExternalLink className="w-3 h-3 text-[#9a9a94] opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
    </button>
  );
}

