'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Card } from '@/components/ui';
import {
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Zap,
  Key,
  Lock,
  Headphones,
  HelpCircle,
  ChevronDown,
  Volume2,
  Check,
  Server,
  Cpu,
} from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { ScrollProgressBar } from '@/components/landing/ScrollProgressBar';
import { InteractiveHeroPreview } from '@/components/landing/InteractiveHeroPreview';
import { ProofMetricsStrip } from '@/components/landing/ProofMetricsStrip';
import { GroundingDemoSection } from '@/components/landing/GroundingDemoSection';
import { FeatureShowcaseSection } from '@/components/landing/FeatureShowcaseSection';
import { ComparisonTableSection } from '@/components/landing/ComparisonTableSection';
import { CtaSection } from '@/components/landing/CtaSection';
import { siteConfig } from '@/config/site';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FAQ_ITEMS = [
  {
    q: 'How does Learning Partner prevent AI hallucinations?',
    a: 'Every answer is strictly grounded in the source documents you enable. Our system uses chunk-level retrieval, an absence-of-information rule ("I could not find information about that in the provided sources"), and exact bracketed citation chips that link directly to the source text.',
  },
  {
    q: 'How does Bring Your Own Key (BYOK) work?',
    a: 'Your API keys are encrypted client-side using industry-standard AES-256-GCM with unique initialization vectors. Plaintext keys are never stored in databases or exposed in logs. You pay providers directly for what you use, often for pennies, or use Google Gemini’s generous free tier.',
  },
  {
    q: 'What file formats can I upload?',
    a: 'Learning Partner supports research PDFs, Microsoft Word (.docx), Markdown (.md), Plain Text (.txt), and live Web URLs with built-in SSRF protection.',
  },
  {
    q: 'How does the Voice Audio Overview work?',
    a: 'Studio Voice generates natural conversational scripts between two co-hosts (Alex and Jordan) or a solo narrator, then synthesizes audio using Google Gemini TTS or OpenAI TTS. We also provide a free "Basic Voice" fallback powered by your browser’s speech synthesis that requires zero API keys.',
  },
  {
    q: 'Is my research data private and secure?',
    a: 'Yes. Every database query in Neon Postgres is strictly isolated by authenticated user ID. We never train AI models on your uploaded files, custom instructions, or chat prompts.',
  },
];

const BYOK_PROVIDERS = [
  { name: 'Google Gemini', desc: 'Gemini 2.0 Flash / Pro with 1M free token context tier', tag: 'Free Tier Available' },
  { name: 'Anthropic Claude', desc: 'Claude 3.5 Sonnet & Haiku for nuanced Socratic analysis', tag: 'High Precision' },
  { name: 'OpenAI', desc: 'GPT-4o & o3-mini models via direct developer keys', tag: 'Standard' },
  { name: 'Groq', desc: 'Ultra-low latency inference running Llama 3.3 models', tag: '300+ tok/s' },
  { name: 'Local Ollama', desc: '100% offline local inference without internet access', tag: 'Offline Safe' },
];

export function LandingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const byokRef = useRef<HTMLDivElement>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from(headlineRef.current, {
          y: 40,
          opacity: 0,
          duration: 0.8,
          delay: 0.1,
        })
        .from(
          subtextRef.current,
          {
            y: 24,
            opacity: 0,
            duration: 0.6,
          },
          '-=0.4'
        )
        .from(
          ctaRef.current,
          {
            y: 20,
            opacity: 0,
            duration: 0.5,
          },
          '-=0.3'
        )
        .from(
          previewRef.current,
          {
            y: 35,
            opacity: 0,
            duration: 0.7,
            scale: 0.98,
          },
          '-=0.3'
        );

      // 2. Proof Metrics Strip Scroll Animation
      gsap.from('.proof-metric-card', {
        scrollTrigger: {
          trigger: '.proof-metric-card',
          start: 'top 85%',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      });

      // 3. Product Story Cards Scroll Animation
      if (storyRef.current) {
        gsap.from('.story-card', {
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top 80%',
          },
          y: 45,
          opacity: 0,
          duration: 0.7,
          stagger: 0.16,
          ease: 'power3.out',
        });
      }

      // 4. Feature Showcase Cards
      gsap.from('.feature-showcase-card', {
        scrollTrigger: {
          trigger: '.feature-showcase-card',
          start: 'top 85%',
        },
        y: 35,
        opacity: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
      });

      // 5. BYOK Section Cards
      if (byokRef.current) {
        gsap.from('.byok-card', {
          scrollTrigger: {
            trigger: byokRef.current,
            start: 'top 80%',
          },
          y: 35,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        });
      }

      // Refresh ScrollTrigger after DOM layout stabilizes
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={heroRef} className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative">
      {/* Top Scroll Progress Indicator */}
      <ScrollProgressBar />

      {/* Subtle Ambient Background Grid & Radial Spotlight */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808010_1px,transparent_1px),linear-gradient(to_bottom,#80808010_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[640px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.18),transparent)] pointer-events-none -z-10" />

      {/* Top Navigation Bar: High-Fidelity Navigation-1 with Smooth Hover */}
      <MarketingHeader isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="pt-10 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center flex flex-col items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-950/70 border border-brand-700/60 text-brand-300 text-[11px] sm:text-xs font-display font-semibold mb-5 sm:mb-6 shadow-sm backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
          <span>Grounded AI Study Workspace · Zero Token Markup BYOK</span>
        </div>

        <h1
          ref={headlineRef}
          className="font-display text-3xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.12] sm:leading-[1.08]"
        >
          Study smarter with an AI that{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-indigo-400">
            answers only from your sources
          </span>
          .
        </h1>

        <p
          ref={subtextRef}
          className="mt-4 sm:mt-6 text-sm sm:text-lg text-muted-foreground max-w-2xl leading-relaxed font-serif"
        >
          Upload your lecture PDFs, docs, links, and study notes. Chat with an AI that grounds every
          response with verifiable citation chips, and generate flashcards, quizzes, mind maps, and conversational audio overviews.
        </p>

        <div
          ref={ctaRef}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
          {isLoggedIn ? (
            <Link href="/app" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3 sm:py-3.5 px-6 font-display">
                Continue to Notebooks <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3 sm:py-3.5 px-6 font-display">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-sm sm:text-base py-3 sm:py-3.5 px-6 font-display">
                  Sign In to Existing Account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Interactive Multi-Tab Hero Card Preview */}
        <div ref={previewRef} className="mt-8 sm:mt-14 w-full">
          <InteractiveHeroPreview />
        </div>
      </section>

      {/* Proof Metrics Strip */}
      <ProofMetricsStrip />

      {/* Product Story: 3-Step Journey */}
      <section ref={storyRef} className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full relative z-10 border-t border-border">
        <div className="text-center mb-10 sm:mb-14">
          <Badge variant="brand" className="mb-3">
            Product Story
          </Badge>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            From Raw Sources to Synthesized Mastery
          </h2>
          <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm max-w-xl mx-auto">
            Watch how Learning Partner grounds knowledge and produces rich interactive studio outputs in three reliable steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative">
          {/* Step 1 Mockup */}
          <Card className="story-card p-5 sm:p-6 bg-surface-raised border-border flex flex-col justify-between hover:border-brand-500/40 transition-all duration-300 shadow-sm hover:shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-950 border border-brand-700/60 flex items-center justify-center text-brand-300 font-display font-bold mb-4 text-base">
                1
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Upload Sources
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Ingest lecture PDFs, DOCX slides, web articles, and personal markdown notes with strict chunk parsing.
              </p>
            </div>
            <div className="space-y-2 p-3 rounded-xl bg-surface border border-border text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Lecture-04_Systems.pdf</span>
                <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">Parsed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>MIT-Notes.docx</span>
                <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">Parsed</span>
              </div>
              <div className="flex items-center justify-between">
                <span>arxiv.org/abs/...</span>
                <span className="text-emerald-400 font-sans text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded">SSRF Safe</span>
              </div>
            </div>
          </Card>

          {/* Step 2 Mockup */}
          <Card className="story-card p-5 sm:p-6 bg-surface-raised border-brand-500/40 flex flex-col justify-between shadow-xl hover:border-brand-500/60 transition-all duration-300">
            <div>
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold mb-4 shadow-md text-base">
                2
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Grounded Chat &amp; Citations
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Ask anything. Every response cites exact passages with zero hallucinated filler or guessing.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-surface border border-border text-xs font-serif leading-relaxed">
              <p className="text-foreground">
                &quot;The primary invariant is that raft log entries are committed strictly in sequential order [1]...&quot;
              </p>
              <span className="citation-chip cursor-pointer inline-flex items-center gap-1 mt-2">
                <span>[1]</span>
                <span className="font-mono text-[10px]">Section 3.2 Page 14</span>
              </span>
            </div>
          </Card>

          {/* Step 3 Mockup */}
          <Card className="story-card p-5 sm:p-6 bg-surface-raised border-border flex flex-col justify-between hover:border-brand-500/40 transition-all duration-300 shadow-sm hover:shadow-lg">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-300 font-display font-bold mb-4 text-base">
                3
              </div>
              <h3 className="font-display font-bold text-base text-foreground mb-1.5 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                Studio Synthesizers
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Synthesize active recall quizzes, interactive flashcards, concept outlines, and two-host audio overviews.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="font-display font-semibold text-foreground">Deep Dive Audio</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Alex &amp; Jordan · 4:18</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-display font-medium">
                Ready
              </span>
            </div>
          </Card>
        </div>
      </section>

      {/* Grounding Retrieval Demonstration Section */}
      <GroundingDemoSection />

      {/* Feature Showcase Grid */}
      <FeatureShowcaseSection />

      {/* "Bring Your Own Key" Architecture Section */}
      <section ref={byokRef} id="byok-section" className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div>
            <Badge variant="brand" className="mb-3">
              True Independence
            </Badge>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Bring Your Own Key.<br />Zero Token Markups.
            </h2>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground font-serif leading-relaxed">
              We never charge recurring subscriptions or mark up token prices. Connect your own API keys from Google Gemini, OpenAI, Anthropic, Groq, or OpenRouter—or run locally on Ollama.
            </p>

            <div className="mt-5 sm:mt-6 space-y-3 text-xs text-foreground font-display">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AES-256-GCM zero-knowledge client-side encryption</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero token markups; pay provider at true cost</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Gemini 1M-token free tier fully supported</span>
              </div>
            </div>

            {/* Provider List Pill Grid */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Supported Model Providers
              </div>
              <div className="space-y-2">
                {BYOK_PROVIDERS.map((prov, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border text-xs">
                    <div>
                      <span className="font-display font-semibold text-foreground mr-2">{prov.name}</span>
                      <span className="text-muted-foreground font-serif text-[11px] hidden sm:inline">{prov.desc}</span>
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 shrink-0">
                      {prov.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 transition-all duration-300 shadow-sm">
              <Key className="w-6 h-6 mx-auto mb-2.5 text-brand-400" />
              <div className="font-display font-bold text-sm text-foreground">BYOK Freedom</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif leading-relaxed">
                Direct provider connection without middleman subscription paywalls.
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 transition-all duration-300 shadow-sm">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2.5 text-emerald-400" />
              <div className="font-display font-bold text-sm text-foreground">Zero Retention</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif leading-relaxed">
                Encrypted in Neon Postgres with per-user database row isolation.
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 transition-all duration-300 shadow-sm">
              <Zap className="w-6 h-6 mx-auto mb-2.5 text-amber-400" />
              <div className="font-display font-bold text-sm text-foreground">Fastest Inference</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif leading-relaxed">
                Full streaming support with Gemini Flash, Claude Sonnet, and Groq.
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 transition-all duration-300 shadow-sm">
              <Headphones className="w-6 h-6 mx-auto mb-2.5 text-purple-400" />
              <div className="font-display font-bold text-sm text-foreground">Studio Voice</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif leading-relaxed">
                2-host podcasts &amp; solo narration with live synchronized captions.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Honest Architectural Comparison Matrix */}
      <ComparisonTableSection />

      {/* Frequently Asked Questions (FAQ) Section with Smooth Animation */}
      <section id="faq-section" className="py-14 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto w-full border-t border-border relative z-10">
        <div className="text-center mb-10 sm:mb-14">
          <Badge variant="neutral" className="mb-3">
            Got Questions?
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm">
            Everything you need to know about grounding, security, and BYOK.
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-display font-bold text-xs sm:text-sm text-foreground hover:text-brand-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-400' : 'text-muted-foreground'}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm font-serif text-muted-foreground leading-relaxed border-t border-border/50">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center text-xs font-display text-muted-foreground">
          <span>Need more details? </span>
          <Link href="/faq" className="text-brand-400 hover:text-brand-300 font-semibold hover:underline inline-flex items-center gap-1">
            Browse all 18 FAQ entries in our Help Center
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* High-Impact Closing CTA Banner */}
      <CtaSection isLoggedIn={isLoggedIn} />

      {/* Modern High-Fidelity Footer with Clean Social Handles */}
      <MarketingFooter />
    </div>
  );
}
