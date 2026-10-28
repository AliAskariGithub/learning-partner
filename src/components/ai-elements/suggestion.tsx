'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Suggestions({ className, children, ...props }: SuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();

    // Wheel event to scroll horizontally with vertical mouse wheel
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        checkScroll();
      }
    };

    el.addEventListener('scroll', checkScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const scrollBy = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full group/suggestions min-w-0">
      {/* Left Scroll Button / Fade */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-1 z-10 flex items-center pr-3 bg-gradient-to-r from-[#191919] via-[#191919]/90 to-transparent">
          <button
            type="button"
            onClick={() => scrollBy(-220)}
            className="w-5 h-5 rounded-full bg-[#262626] border border-[#383838] text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#303030] flex items-center justify-center shadow-md transition cursor-pointer"
            title="Scroll left"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Chips Container */}
      <div
        ref={containerRef}
        className={cn(
          'w-full flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth scrollbar-none overscroll-x-contain select-none px-1',
          className
        )}
        {...props}
      >
        {children}
      </div>

      {/* Right Scroll Button / Fade */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-1 z-10 flex items-center pl-3 bg-gradient-to-l from-[#191919] via-[#191919]/90 to-transparent">
          <button
            type="button"
            onClick={() => scrollBy(220)}
            className="w-5 h-5 rounded-full bg-[#262626] border border-[#383838] text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#303030] flex items-center justify-center shadow-md transition cursor-pointer"
            title="Scroll right"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export interface SuggestionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  suggestion: string;
  onSelectSuggestion?: (suggestion: string) => void;
  icon?: React.ReactNode;
}

export function Suggestion({
  suggestion,
  onSelectSuggestion,
  icon,
  className,
  children,
  ...props
}: SuggestionProps) {
  return (
    <button
      type="button"
      onClick={() => onSelectSuggestion?.(suggestion)}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-display font-medium text-[#c8c8c2] hover:text-[#f4f4f2] bg-[#262626] hover:bg-[#303030] border border-[#383838] hover:border-brand-500/40 transition-all cursor-pointer shadow-sm whitespace-nowrap shrink-0 group',
        className
      )}
      {...props}
    >
      {icon ?? <Sparkles className="w-3 h-3 text-brand-400 group-hover:text-brand-300 shrink-0" />}
      <span>{children || suggestion}</span>
    </button>
  );
}
