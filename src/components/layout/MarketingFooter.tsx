'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowUpRight, Globe, Check } from 'lucide-react';
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
  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.6, bounce: 0 },
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
  location?: string;
}

export function MarketingFooter({
  badgeText = 'ENGINEERED FOR RIGOROUS STUDY',
  newsletterHeading = 'The latest study features,\ngrounded AI research, and updates,\nin your inbox.',
  newsletterPlaceholder = 'Enter your student or researcher email',
  newsletterButtonText = 'Stay Updated',
  brandName = siteConfig.name,
  brandLogo,
  navColumns,
  copyright = `© ${new Date().getFullYear()} ${siteConfig.name}. Open-source study workspace.`,
  location = 'Vercel (iad1) • Neon Postgres (us-east-1)',
}: MarketingFooterProps) {
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Format live client time to avoid SSR hydration mismatch
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
        className="relative w-full border-t border-border/80 bg-[#09090b] text-neutral-300 font-sans overflow-hidden selection:bg-brand-500/30"
      >
        {/* ── Background Effects ── */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {/* Bottom Left Glow */}
          <div className="absolute bottom-[-20%] left-[-10%] w-[55%] h-[55%] bg-brand-600/15 blur-[130px] rounded-full" />

          {/* Dotted Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1.5px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 sm:pt-20 pb-10 flex flex-col justify-between">
          {/* ── Top Section: Newsletter & Tagline ── */}
          <div className="flex flex-col lg:flex-row justify-between items-start gap-10 lg:gap-20 mb-16 sm:mb-20">
            <motion.div variants={riseItem} className="max-w-xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_12px_rgba(99,102,241,0.8)] animate-pulse" />
                <span className="text-xs sm:text-sm font-display font-semibold uppercase tracking-wider text-neutral-200">
                  {badgeText}
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] text-white tracking-tight whitespace-pre-line">
                {newsletterHeading}
              </h2>
            </motion.div>

            <motion.div variants={riseItem} className="w-full max-w-md lg:mt-auto">
              {subscribed ? (
                <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 text-white flex items-center gap-3 text-xs sm:text-sm font-serif">
                  <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>Thank you for subscribing! We&apos;ll keep you posted on updates.</span>
                </div>
              ) : (
                <form className="flex w-full h-13 sm:h-14" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder={newsletterPlaceholder}
                    className="flex-1 bg-neutral-950/80 border border-neutral-800 border-r-0 px-4 sm:px-5 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-shadow rounded-l-xl font-serif"
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
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 sm:gap-16 mb-16 sm:mb-20 pt-8 border-t border-neutral-800/80">
            <motion.div variants={riseItem} className="flex items-center gap-3 text-white">
              {brandLogo || (
                <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-sm shadow-md shadow-brand-600/30 shrink-0">
                  LP
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-white">
                  {brandName}
                </span>
                <span className="font-serif text-xs text-neutral-400">
                  Grounded AI Study Workspace
                </span>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 sm:gap-14 lg:gap-20">
              {columns.map((col, idx) => (
                <motion.div key={idx} variants={riseItem} className="flex flex-col gap-4">
                  <h4 className="font-display text-xs font-bold tracking-wider text-white uppercase">
                    {col.title}
                  </h4>
                  <ul className="flex flex-col gap-2.5 font-serif text-xs sm:text-sm">
                    {col.links.map((link, lIdx) => (
                      <li key={lIdx}>
                        <Link
                          href={link.href}
                          className="text-neutral-400 hover:text-white transition-colors"
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

          {/* ── Bottom Section: Meta & Controls ── */}
          <motion.div
            variants={riseItem}
            className="flex flex-col md:flex-row justify-between items-center gap-5 pt-8 text-xs text-neutral-500 border-t border-neutral-800/80 font-serif"
          >
            <p className="text-center md:text-left">{copyright}</p>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 font-mono text-[11px]">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-brand-400" />
                <span>{location}</span>
              </div>
              {currentTime && (
                <span className="tabular-nums tracking-wider text-neutral-400">
                  {currentTime}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-display text-xs">
              <button
                type="button"
                onClick={() => setCookieModalOpen(true)}
                className="hover:text-white transition-colors cursor-pointer text-neutral-400"
              >
                Cookie Settings
              </button>
              <Link href="/privacy" className="hover:text-white transition-colors text-neutral-400">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors text-neutral-400">
                Terms
              </Link>
              <a
                href={siteConfig.owner.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors text-neutral-400 inline-flex items-center gap-1"
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
