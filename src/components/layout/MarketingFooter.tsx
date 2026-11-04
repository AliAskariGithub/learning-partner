'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { CookiePreferencesModal } from '@/components/cookies/CookiePreferencesModal';
import { siteConfig } from '@/config/site';

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.55, bounce: 0 },
  },
};

export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface MarketingFooterProps {
  badgeText?: string;
  newsletterHeading?: string;
  newsletterPlaceholder?: string;
  newsletterButtonText?: string;
  brandName?: string;
  brandLogo?: React.ReactNode;
  navColumns?: FooterColumn[];
  copyright?: string;
  githubUrl?: string;
}

export function MarketingFooter({
  badgeText = 'WEEKLY RESEARCH & DISPATCHES',
  newsletterHeading = 'The latest study features & AI research,\ndelivered straight to your inbox.',
  newsletterPlaceholder = 'Enter your student or researcher email',
  newsletterButtonText = 'Subscribe',
  brandName = siteConfig.name,
  brandLogo,
  navColumns,
  copyright = `© ${new Date().getFullYear()} ${siteConfig.name}. Open-source study workspace.`,
  githubUrl = siteConfig.owner.githubUrl,
}: MarketingFooterProps) {
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const headingLines = newsletterHeading.split('\n');

  const defaultNavColumns: FooterColumn[] = [
    {
      title: 'PRODUCT',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Features Tour', href: '/features' },
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Pricing & Cost Guide', href: '/pricing' },
        { label: 'Example Use Cases', href: '/use-cases' },
      ],
    },
    {
      title: 'RESOURCES',
      links: [
        { label: 'Connect Your AI', href: '/connect-ai' },
        { label: 'Help Center & Docs', href: '/help' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Open Workspace', href: '/app' },
      ],
    },
    {
      title: 'SUPPORT & LEGAL',
      links: [
        { label: 'Contact Support', href: '/contact' },
        { label: 'Report a Bug', href: '/feedback' },
        { label: 'Security Architecture', href: '/security' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
  ];

  const columns = navColumns || defaultNavColumns;

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) return;
    setSubscribed(true);
    setEmailInput('');
  };

  return (
    <>
      <motion.footer
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="relative w-full border-t border-border bg-background text-foreground font-sans overflow-hidden selection:bg-brand-500/30"
      >
        {/* ── Background Effects: Grounded in website theme ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Subtle Ambient Brand Glow */}
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/10 dark:bg-brand-600/15 blur-[120px] rounded-full" />

          {/* Dotted Grid Pattern adapting to dark/light theme */}
          <div
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1.5px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-14 sm:pt-18 pb-8 flex flex-col justify-between">
          {/* ── Top Section: 2-Line Heading & Newsletter Subscribe ── */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16">
            <motion.div variants={riseItem} className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2.5 mb-3.5">
                <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] animate-pulse" />
                <span className="text-[11px] sm:text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                  {badgeText}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-[1.95rem] xl:text-[2.25rem] font-extrabold leading-[1.2] sm:leading-[1.18] text-foreground tracking-tight">
                {headingLines.map((line, idx) => (
                  <span key={idx} className="block md:whitespace-nowrap">
                    {line}
                  </span>
                ))}
              </h2>
            </motion.div>

            <motion.div variants={riseItem} className="w-full max-w-md lg:w-96 lg:max-w-sm shrink-0 lg:mb-1">
              {subscribed ? (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 text-foreground flex items-center gap-3 text-xs sm:text-sm font-serif">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Thank you for subscribing! We&apos;ll keep you posted on updates.</span>
                </div>
              ) : (
                <form className="flex w-full h-12 sm:h-13" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={newsletterPlaceholder}
                    className="flex-1 bg-surface border border-border border-r-0 px-4 sm:px-5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand-500 transition-shadow rounded-l-xl font-serif"
                    required
                  />
                  <button
                    type="submit"
                    className="h-full px-5 sm:px-6 bg-brand-600 hover:bg-brand-500 transition-colors border border-brand-500 flex items-center justify-center gap-2 text-xs sm:text-sm font-display font-semibold text-white rounded-r-xl cursor-pointer shrink-0"
                  >
                    <span>{newsletterButtonText}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* ── Middle Section: Links & Brand Logo ── */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 sm:gap-14 mb-12 sm:mb-16 pt-8 border-t border-border">
            <motion.div variants={riseItem} className="flex items-center gap-3 text-foreground">
              {brandLogo || (
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md shadow-brand-600/30 shrink-0">
                  LP
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-foreground">
                  {brandName}
                </span>
                <span className="font-serif text-xs text-muted-foreground">
                  Grounded AI Study Workspace
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">
              {columns.map((col, idx) => (
                <motion.div key={idx} variants={riseItem} className="flex flex-col gap-3.5">
                  <h4 className="font-display text-xs font-bold tracking-wider text-foreground uppercase">
                    {col.title}
                  </h4>
                  <ul className="flex flex-col gap-2.5 font-serif text-xs sm:text-sm">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          href={link.href}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Bottom Section: Meta & Controls (Clean 2-Sided Layout without Location/Clock) ── */}
          <motion.div
            variants={riseItem}
            className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 text-xs text-muted-foreground border-t border-border font-serif"
          >
            <p className="text-center sm:text-left">{copyright}</p>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-display text-xs">
              <button
                type="button"
                onClick={() => setCookieModalOpen(true)}
                className="hover:text-foreground transition-colors cursor-pointer text-muted-foreground"
              >
                Cookie Settings
              </button>
              <Link href="/privacy" className="hover:text-foreground transition-colors text-muted-foreground">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors text-muted-foreground">
                Terms
              </Link>
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors text-muted-foreground inline-flex items-center gap-1"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        </div>
      </motion.footer>

      <CookiePreferencesModal
        open={cookieModalOpen}
        onOpenChange={setCookieModalOpen}
      />
    </>
  );
}

export default MarketingFooter;
