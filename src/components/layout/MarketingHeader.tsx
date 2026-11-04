'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Layers,
  HelpCircle,
  Headphones,
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  FileText,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { siteConfig } from '@/config/site';

export function MarketingHeader({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const pathname = usePathname();
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSolutionsExpanded, setMobileSolutionsExpanded] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);

  // Close menus on route change
  useEffect(() => {
    setSolutionsOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        navContainerRef.current &&
        !navContainerRef.current.contains(event.target as Node)
      ) {
        setSolutionsOpen(false);
      }
    }

    if (solutionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [solutionsOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSolutionsOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      ref={navContainerRef}
      className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Left: Logo & Desktop Navigation ── */}
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg cursor-pointer shrink-0"
            title={`${siteConfig.name} — Return to home`}
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-xs shadow-md shadow-brand-600/30 shrink-0 group-hover:scale-105 transition-transform">
              LP
            </div>
            <span className="font-display font-bold text-base sm:text-lg text-foreground tracking-tight whitespace-nowrap group-hover:text-brand-500 transition-colors">
              {siteConfig.name}
            </span>
          </Link>

          {/* Desktop Navigation Menu Links */}
          <nav className="hidden lg:flex items-center gap-1 font-display text-xs sm:text-sm">
            <Link
              href="/features"
              className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                pathname === '/features'
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              Features
            </Link>

            <Link
              href="/how-it-works"
              className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                pathname === '/how-it-works'
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              How It Works
            </Link>

            {/* Mega Menu Trigger: Solutions */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSolutionsOpen((prev) => !prev)}
                aria-expanded={solutionsOpen}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-all cursor-pointer ${
                  solutionsOpen || pathname.startsWith('/use-cases')
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
                }`}
              >
                <span>Solutions</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    solutionsOpen ? 'rotate-180 text-brand-500' : 'text-muted-foreground'
                  }`}
                />
              </button>
            </div>

            <Link
              href="/pricing"
              className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                pathname === '/pricing'
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              Pricing
            </Link>

            <Link
              href="/connect-ai"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-medium transition-colors ${
                pathname === '/connect-ai'
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                  : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              <span>Connect AI</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30">
                BYOK
              </span>
            </Link>
          </nav>
        </div>

        {/* ── Right: Theme Toggle & Auth Action Buttons ── */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />

          {isLoggedIn ? (
            <Link href="/app">
              <Button
                variant="primary"
                size="sm"
                className="rounded-xl px-4 py-2 text-xs sm:text-sm font-display font-semibold whitespace-nowrap inline-flex items-center gap-1.5 shadow-sm"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl px-3 py-2 text-xs sm:text-sm font-display font-medium text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-xl px-4 py-2 text-xs sm:text-sm font-display font-semibold text-white whitespace-nowrap shadow-sm"
                >
                  Get started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile Hamburger Trigger ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── Desktop Mega Menu: Solutions (Watermelon Navigation-1 Layout) ── */}
      <AnimatePresence>
        {solutionsOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-x-0 top-full w-full border-b border-border bg-surface shadow-2xl shadow-black/20 dark:shadow-black/60 z-50 overflow-hidden"
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-border px-6 sm:px-8 py-8">
              {/* Column 1: Core Study Studio Spotlight */}
              <div className="flex flex-col pr-0 md:pr-4">
                <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="mb-1 text-sm font-bold font-display text-foreground">
                  Grounded Study Studio
                </h4>
                <p className="mb-4 text-xs font-serif leading-relaxed text-muted-foreground">
                  Grounded AI study partner that answers strictly from your uploaded sources with verifiable citation chips.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  <Link
                    href="/features"
                    onClick={() => setSolutionsOpen(false)}
                    className="inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11px] font-display font-medium border border-border bg-surface-raised hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Layers className="h-3 w-3 text-brand-500" />
                    <span>Chat &amp; Learn</span>
                  </Link>
                  <Link
                    href="/features"
                    onClick={() => setSolutionsOpen(false)}
                    className="inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11px] font-display font-medium border border-border bg-surface-raised hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HelpCircle className="h-3 w-3 text-brand-500" />
                    <span>Active Quizzes</span>
                  </Link>
                  <Link
                    href="/features"
                    onClick={() => setSolutionsOpen(false)}
                    className="inline-flex items-center gap-1.5 h-7 rounded-full px-3 text-[11px] font-display font-medium border border-border bg-surface-raised hover:border-brand-500/40 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Headphones className="h-3 w-3 text-brand-500" />
                    <span>Voice Audio</span>
                  </Link>
                </div>
              </div>

              {/* Column 2: Study Use Cases */}
              <div className="flex flex-col gap-2.5 pt-4 md:pt-0 md:pl-6">
                <h4 className="mb-1 text-xs font-bold font-display uppercase tracking-wider text-muted-foreground">
                  Use Cases
                </h4>
                <Link
                  href="/use-cases"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                >
                  <span>Exam &amp; Board Prep</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-500" />
                </Link>
                <Link
                  href="/use-cases"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                >
                  <span>Research &amp; Literature Review</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-500" />
                </Link>
                <Link
                  href="/use-cases"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                >
                  <span>Technical &amp; Code Documentation</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-500" />
                </Link>
                <Link
                  href="/use-cases"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between group"
                >
                  <span>Language Learning &amp; Bilingual</span>
                  <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-500" />
                </Link>
              </div>

              {/* Column 3: Resources & Guides */}
              <div className="flex flex-col gap-2.5 pt-4 md:pt-0 md:pl-6">
                <h4 className="mb-1 text-xs font-bold font-display uppercase tracking-wider text-muted-foreground">
                  Resources
                </h4>
                <Link
                  href="/help"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center &amp; Documentation
                </Link>
                <Link
                  href="/security"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  Security &amp; Encryption
                </Link>
                <Link
                  href="/faq"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  Frequently Asked Questions
                </Link>
                <Link
                  href="/connect-ai"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  Connect Your AI Guide
                </Link>
                <Link
                  href="/about"
                  onClick={() => setSolutionsOpen(false)}
                  className="text-xs sm:text-sm font-serif text-muted-foreground hover:text-foreground transition-colors"
                >
                  About Learning Partner
                </Link>
              </div>

              {/* Column 4: Featured Spotlight Card */}
              <div className="flex flex-col pt-4 md:pt-0 md:pl-6">
                <h4 className="mb-2 text-xs font-bold font-display uppercase tracking-wider text-muted-foreground">
                  Featured
                </h4>
                <Link
                  href="/connect-ai"
                  onClick={() => setSolutionsOpen(false)}
                  className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-5 border border-brand-500/30 bg-brand-500/5 hover:border-brand-500/60 transition-all shadow-sm cursor-pointer"
                >
                  <div>
                    <span className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-600 dark:text-brand-300 text-[10px] font-mono font-semibold">
                      Zero Lock-In BYOK
                    </span>
                    <h5 className="mb-1.5 text-sm font-bold font-display text-foreground group-hover:text-brand-500 transition-colors">
                      Bring Your Own Keys
                    </h5>
                    <p className="text-xs font-serif leading-relaxed text-muted-foreground">
                      Free tier with Google Gemini, ChatGPT Plus funding, or local models. Credentials stay encrypted with AES-256-GCM.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center text-xs font-display font-semibold text-brand-600 dark:text-brand-400 group-hover:underline">
                    <span>Explore setup guide</span>
                    <ArrowUpRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Slide-Out Drawer / Sheet ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Slide-out Sheet Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[310px] sm:w-[380px] bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between pb-5 border-b border-border mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center font-display font-bold text-white text-xs">
                      LP
                    </div>
                    <span className="font-display font-bold text-base text-foreground">
                      {siteConfig.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Close navigation menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Nav Links */}
                <div className="flex flex-col gap-1 font-display text-sm">
                  <Link
                    href="/features"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-foreground hover:text-brand-500 transition-colors"
                  >
                    Features
                  </Link>

                  <Link
                    href="/how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-foreground hover:text-brand-500 transition-colors"
                  >
                    How It Works
                  </Link>

                  {/* Mobile Collapsible Solutions Accordion */}
                  <div className="border-y border-border/60 py-1 my-1">
                    <button
                      type="button"
                      onClick={() => setMobileSolutionsExpanded(!mobileSolutionsExpanded)}
                      className="w-full flex items-center justify-between py-2 text-foreground font-display font-medium cursor-pointer"
                    >
                      <span>Solutions &amp; Use Cases</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform ${
                          mobileSolutionsExpanded ? 'rotate-180 text-brand-500' : ''
                        }`}
                      />
                    </button>

                    {mobileSolutionsExpanded && (
                      <div className="pl-3 py-1 space-y-2 border-l-2 border-brand-500/40 ml-1 font-serif text-xs">
                        <Link
                          href="/use-cases"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-muted-foreground hover:text-foreground"
                        >
                          Exam &amp; Board Prep
                        </Link>
                        <Link
                          href="/use-cases"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-muted-foreground hover:text-foreground"
                        >
                          Research &amp; Literature Review
                        </Link>
                        <Link
                          href="/use-cases"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-muted-foreground hover:text-foreground"
                        >
                          Technical Documentation
                        </Link>
                        <Link
                          href="/help"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-muted-foreground hover:text-foreground"
                        >
                          Help Center &amp; Guides
                        </Link>
                        <Link
                          href="/security"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-muted-foreground hover:text-foreground"
                        >
                          Security Architecture
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/pricing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-foreground hover:text-brand-500 transition-colors"
                  >
                    Pricing
                  </Link>

                  <Link
                    href="/connect-ai"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2 text-foreground hover:text-brand-500 transition-colors"
                  >
                    <span>Connect AI</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/30">
                      BYOK
                    </span>
                  </Link>
                </div>
              </div>

              {/* Mobile Drawer Footer with Auth CTA */}
              <div className="pt-6 border-t border-border flex flex-col gap-2.5 font-display text-xs">
                {isLoggedIn ? (
                  <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full justify-center rounded-xl py-2.5">
                      Open Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full justify-center rounded-xl py-2.5">
                        Sign in
                      </Button>
                    </Link>
                    <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full justify-center rounded-xl py-2.5">
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default MarketingHeader;
