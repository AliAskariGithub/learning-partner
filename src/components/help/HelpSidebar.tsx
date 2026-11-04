'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronDown, HelpCircle, Bug, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpArticleFrontmatter } from '@/lib/content';

interface HelpSidebarProps {
  articles: {
    slug: string;
    frontmatter: HelpArticleFrontmatter;
  }[];
}

export function HelpSidebar({ articles }: HelpSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Group articles by category
  const categories = articles.reduce<Record<string, typeof articles>>((acc, item) => {
    const cat = item.frontmatter.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Mobile Toggle Button */}
      <div className="lg:hidden mb-6 border border-border bg-surface rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-display font-semibold text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
          aria-expanded={mobileOpen}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-brand-500" />
            Documentation Topics
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-muted-foreground transition-transform duration-200',
              mobileOpen && 'rotate-180 text-brand-500'
            )}
          />
        </button>

        {mobileOpen && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border/50 text-xs font-serif">
            {Object.entries(categories).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <span className="font-display font-bold text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">
                  {category}
                </span>
                <ul className="space-y-1 pl-1">
                  {items.map((art) => {
                    const isActive = pathname === `/help/${art.slug}`;
                    return (
                      <li key={art.slug}>
                        <Link
                          href={`/help/${art.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block py-1 px-2 rounded-lg text-xs transition-colors',
                            isActive
                              ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {art.frontmatter.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block sticky top-24 bg-surface/50 border border-border/60 rounded-2xl p-4 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-border text-xs font-display font-bold tracking-tight text-foreground uppercase">
          <BookOpen className="w-3.5 h-3.5 text-brand-500" />
          Documentation
        </div>

        <nav aria-label="Help topics" className="space-y-5">
          {Object.entries(categories).map(([category, items]) => (
            <div key={category} className="space-y-1.5">
              <span className="font-display font-bold text-[10px] text-muted-foreground uppercase tracking-wider block px-2">
                {category}
              </span>
              <ul className="space-y-0.5">
                {items.map((art) => {
                  const isActive = pathname === `/help/${art.slug}`;
                  return (
                    <li key={art.slug}>
                      <Link
                        href={`/help/${art.slug}`}
                        className={cn(
                          'block py-1.5 px-2.5 rounded-lg text-xs font-serif transition-colors',
                          isActive
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold border-l-2 border-brand-500'
                            : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                        )}
                      >
                        {art.frontmatter.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Quick Support Links */}
        <div className="pt-4 border-t border-border/60 space-y-1.5 text-xs font-display">
          <Link
            href="/contact"
            className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-brand-500" />
            <span>Contact Support</span>
          </Link>
          <Link
            href="/feedback"
            className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
          >
            <Bug className="w-3.5 h-3.5 text-brand-500" />
            <span>Report a Bug</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

