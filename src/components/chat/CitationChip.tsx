'use client';

import React, { useState } from 'react';
import { Citation } from '@/db/schema';
import { BookOpen } from 'lucide-react';

interface CitationChipProps {
  citationNumber: number;
  citation?: Citation;
  onClick?: () => void;
}

export function CitationChip({ citationNumber, citation, onClick }: CitationChipProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <span
      className="relative inline-block mx-0.5 align-baseline"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-md text-[10px] font-mono font-bold transition cursor-pointer shadow-xs select-none border bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 dark:bg-[#1f1f1f] dark:border-[#383838] dark:text-brand-300 dark:hover:bg-[#282828] dark:hover:text-white"
        title={citation ? `${citation.sourceTitle}${citation.pageNumber ? ` (p. ${citation.pageNumber})` : ''}` : `Citation [${citationNumber}]`}
      >
        {citationNumber}
      </button>

      {/* Hover preview tooltip */}
      {hovered && citation && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 rounded-xl text-xs shadow-2xl backdrop-blur-md z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-100 border bg-[#1f1f1f] border-[#383838] text-[#f4f4f2] dark:bg-white dark:border-zinc-200 dark:text-zinc-900"
        >
          <span className="flex items-center gap-1.5 font-display font-semibold text-[11px] text-brand-600 dark:text-brand-300 mb-1 truncate block">
            <BookOpen className="w-3 h-3 shrink-0" />
            {citation.sourceTitle}
            {citation.pageNumber && (
              <span className="text-zinc-500 dark:text-[#9a9a94] font-mono text-[10px]">
                (Page {citation.pageNumber})
              </span>
            )}
          </span>
          <span className="text-[11px] text-zinc-600 dark:text-[#9a9a94] font-serif leading-snug line-clamp-3 block">
            "{citation.snippet}"
          </span>
          <span className="text-[9px] text-brand-600 dark:text-brand-400 font-display mt-1 block">
            Click to view in source viewer →
          </span>
        </span>
      )}
    </span>
  );
}
