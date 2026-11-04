'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowRight } from 'lucide-react';

export function MarketingHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <header className="h-16 border-b border-border bg-surface/85 backdrop-blur-md sticky top-0 z-40 px-3.5 sm:px-6 lg:px-12 flex items-center justify-between">
      <Link
        href="/"
        className="flex items-center gap-2.5 sm:gap-3 min-w-0 group hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg cursor-pointer"
        title="Learning Partner — Return to home"
      >
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md shadow-brand-600/30 shrink-0 group-hover:scale-105 transition-transform">
          LP
        </div>
        <span className="font-display font-bold text-base sm:text-lg text-foreground tracking-tight whitespace-nowrap group-hover:text-brand-300 transition-colors">
          Learning Partner
        </span>
      </Link>

      <nav className="flex items-center gap-2 sm:gap-4 shrink-0">
        <ThemeToggle />
        {isLoggedIn ? (
          <Link href="/app">
            <Button variant="primary" size="sm" className="whitespace-nowrap px-3 sm:px-4 text-xs sm:text-sm">
              Open App <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="px-2 sm:px-3 text-xs sm:text-sm">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" size="sm" className="px-2.5 sm:px-3.5 text-xs sm:text-sm whitespace-nowrap">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

