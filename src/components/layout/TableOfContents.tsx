'use client';

import React, { useEffect, useState } from 'react';
import { AlignLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  label: string;
  depth?: number;
}

export interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0% -60% 0%' }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={cn('w-full lg:w-64 shrink-0', className)}
    >
      {/* Mobile Collapsible Drawer */}
      <div className="lg:hidden mb-6 border border-border bg-surface rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-display font-semibold text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <AlignLeft className="w-3.5 h-3.5 text-brand-500" />
            Table of Contents
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              mobileOpen && 'rotate-180 text-brand-500'
            )}
          />
        </button>

        {mobileOpen && (
          <ul className="px-4 pb-3 pt-1 space-y-1.5 border-t border-border/50 text-xs font-serif">
            {items.map((item) => (
              <li key={item.id} className={item.depth === 3 ? 'pl-3' : ''}>
                <a
                  href={`#${item.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block py-1 transition-colors',
                    activeId === item.id
                      ? 'text-brand-600 dark:text-brand-400 font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block sticky top-24 bg-surface/50 border border-border/60 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-border text-xs font-display font-bold tracking-tight text-foreground uppercase">
          <AlignLeft className="w-3.5 h-3.5 text-brand-500" />
          On this page
        </div>
        <ul className="space-y-1.5 text-xs font-serif">
          {items.map((item) => (
            <li key={item.id} className={item.depth === 3 ? 'pl-3 border-l border-border/50 ml-1.5' : ''}>
              <a
                href={`#${item.id}`}
                className={cn(
                  'block py-1 rounded transition-colors',
                  activeId === item.id
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

