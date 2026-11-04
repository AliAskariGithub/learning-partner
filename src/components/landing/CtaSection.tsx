'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

export function CtaSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10">
      <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 border border-brand-500/30 bg-gradient-to-b from-brand-950/40 via-surface to-surface text-center overflow-hidden shadow-2xl shadow-brand-500/5">
        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-brand-500/20 blur-3xl pointer-events-none -z-10" />

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-display font-semibold mb-4">
          <Zap className="w-3.5 h-3.5" />
          <span>Start Grounded Research Today</span>
        </span>

        <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
          Ready to study with verified confidence?
        </h2>

        <p className="mt-4 text-xs sm:text-base text-muted-foreground font-serif max-w-xl mx-auto leading-relaxed">
          Upload your materials, connect your preferred provider key, and experience citations that never make things up.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {isLoggedIn ? (
            <Link href="/app" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3.5 px-7 font-display"
              >
                <span>Open Study Workspace</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3.5 px-7 font-display"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/connect-ai" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base py-3.5 px-6 font-display"
                >
                  <span>Explore BYOK Setup</span>
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Assurance Badges */}
        <div className="mt-8 pt-8 border-t border-border/60 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-display">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Grounded Citations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-brand-400" />
            <span>AES-256-GCM Encrypted Keys</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Zero Subscription Markups</span>
          </div>
        </div>
      </div>
    </section>
  );
}
