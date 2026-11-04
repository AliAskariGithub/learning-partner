'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import { TableOfContents, TocItem } from './TableOfContents';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface PageShellProps {
  title: string;
  intro?: string;
  badge?: string;
  toc?: TocItem[];
  children: React.ReactNode;
  isLoggedIn?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

export function PageShell({
  title,
  intro,
  badge,
  toc,
  children,
  isLoggedIn = false,
  maxWidth = 'xl',
  className = '',
}: PageShellProps) {
  const shouldReduceMotion = useReducedMotion();

  const maxWidthClasses = {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-7xl',
  }[maxWidth];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-brand-600 selection:text-white">
      <MarketingHeader isLoggedIn={isLoggedIn} />

      <main className="flex-1">
        {/* Page Hero */}
        <section className="pt-10 sm:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 border-b border-border/40 bg-gradient-to-b from-surface/40 to-background">
          <div className={cn('mx-auto text-center flex flex-col items-center', maxWidthClasses)}>
            {badge && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Badge variant="neutral" className="mb-4 text-[11px] sm:text-xs">
                  {badge}
                </Badge>
              </motion.div>
            )}

            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]"
            >
              {title}
            </motion.h1>

            {intro && (
              <motion.p
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-4 sm:mt-5 text-sm sm:text-lg text-muted-foreground max-w-2xl font-serif leading-relaxed"
              >
                {intro}
              </motion.p>
            )}
          </div>
        </section>

        {/* Content Body with optional TOC sidebar */}
        <section className={cn('mx-auto px-4 sm:px-6 py-8 sm:py-14', maxWidthClasses, className)}>
          {toc && toc.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              <TableOfContents items={toc} />
              <div className="flex-1 min-w-0 w-full">{children}</div>
            </div>
          ) : (
            <div className="w-full">{children}</div>
          )}
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

