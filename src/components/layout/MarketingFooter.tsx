'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CookiePreferencesModal } from '@/components/cookies/CookiePreferencesModal';

export function MarketingFooter() {
  const [cookieModalOpen, setCookieModalOpen] = useState(false);

  return (
    <>
      <footer className="mt-auto border-t border-border bg-surface py-8 sm:py-12 px-4 sm:px-6 lg:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-display font-bold text-xs shrink-0">
                LP
              </div>
              <span className="font-display font-bold text-sm text-foreground">Learning Partner</span>
            </div>
            <span className="text-xs text-muted-foreground font-serif">
              © {new Date().getFullYear()} Open-Source Study Studio
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3.5 sm:gap-6 text-xs text-muted-foreground font-display">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <button
              type="button"
              onClick={() => setCookieModalOpen(true)}
              className="hover:text-foreground transition-colors cursor-pointer text-left"
            >
              Cookie Settings
            </button>
            <Link href="/app" className="hover:text-foreground transition-colors">
              Workspace
            </Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
          </div>
        </div>
      </footer>

      <CookiePreferencesModal
        open={cookieModalOpen}
        onOpenChange={setCookieModalOpen}
      />
    </>
  );
}

