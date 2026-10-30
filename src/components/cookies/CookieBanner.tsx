'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsent } from '@/hooks/useConsent';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { ShieldCheck, Cookie } from 'lucide-react';

export function CookieBanner() {
  const { hasAnswered, acceptAll, rejectNonEssential, isGpc } = useConsent();
  const [modalOpen, setModalOpen] = useState(false);

  // If user already answered or server GPC was auto-recorded and user answered, hide banner
  if (hasAnswered) {
    return (
      <CookiePreferencesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    );
  }

  return (
    <>
      <AnimatePresence>
        <motion.aside
          role="region"
          aria-label="Cookie and privacy preferences"
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-4 left-4 z-50 w-[calc(100vw-2rem)] sm:w-[440px] p-5 rounded-2xl bg-[#1f1f1f]/95 border border-[#383838] shadow-2xl backdrop-blur-xl text-[#f4f4f2]"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Cookie className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-display font-bold text-[#f4f4f2]">
                  Your Privacy & Local Preferences
                </h3>
                <p className="text-[11px] text-[#9a9a94] font-serif">
                  No tracking. No advertising. Only your learning experience.
                </p>
              </div>
            </div>

            {isGpc && (
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-1.5 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Global Privacy Control (GPC) detected. Non-essential cookies default to off.</span>
              </div>
            )}

            <p className="text-xs text-[#b8b8b0] font-serif leading-relaxed">
              We use strictly necessary cookies to authenticate your session and protect against CSRF attacks. With your consent, we also save device preferences like your dark/light theme, language, and panel sizes. Read our{' '}
              <Link
                href="/cookies"
                className="text-brand-300 underline underline-offset-2 hover:text-brand-200 transition-colors"
              >
                Cookie Policy
              </Link>{' '}
              for details.
            </p>

            {/* Three buttons with EQUAL visual prominence (clean borders, uniform weights, no dark patterns) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={acceptAll}
                className="px-3 py-2 rounded-xl text-xs font-display font-semibold bg-[#2e2e2e] hover:bg-[#383838] text-[#f4f4f2] border border-[#444444] hover:border-brand-500/60 transition-all cursor-pointer text-center"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={rejectNonEssential}
                className="px-3 py-2 rounded-xl text-xs font-display font-semibold bg-[#2e2e2e] hover:bg-[#383838] text-[#f4f4f2] border border-[#444444] hover:border-rose-500/60 transition-all cursor-pointer text-center"
              >
                Reject non-essential
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-display font-semibold bg-[#2e2e2e] hover:bg-[#383838] text-[#f4f4f2] border border-[#444444] hover:border-amber-500/60 transition-all cursor-pointer text-center"
              >
                Customize
              </button>
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>

      <CookiePreferencesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

