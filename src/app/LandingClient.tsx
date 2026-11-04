'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { Button, Badge, Card } from '@/components/ui';
import {
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Zap,
  Key,
  Lock,
  Headphones,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const FAQ_ITEMS = [
  {
    q: 'How does Learning Partner prevent hallucinations?',
    a: 'Every answer is strictly grounded in the source documents you enable. Our system uses chunk-level retrieval, an absence-of-information rule ("I could not find information about that in the provided sources"), and exact bracketed citation chips that link directly to the source text.',
  },
  {
    q: 'How does Bring Your Own Key (BYOK) work?',
    a: 'Your API keys are encrypted client-side using industry-standard AES-256-GCM with unique initialization vectors. Plaintext keys are never stored in databases or exposed in logs. You pay providers directly for what you use, often for pennies, or use Google Gemini’s free tier.',
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

export function LandingClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const storySectionRef = useRef<HTMLDivElement>(null);
  const byokSectionRef = useRef<HTMLDivElement>(null);
  const faqSectionRef = useRef<HTMLDivElement>(null);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Top Scroll Progress Line
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // ── 1. Hero Entrance Timeline ──
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from(headlineRef.current, {
          y: 45,
          opacity: 0,
          duration: 0.85,
          delay: 0.1,
        })
        .from(
          subtextRef.current,
          {
            y: 28,
            opacity: 0,
            duration: 0.65,
          },
          '-=0.45'
        )
        .from(
          ctaRef.current,
          {
            y: 22,
            opacity: 0,
            duration: 0.55,
          },
          '-=0.35'
        )
        .from(
          previewRef.current,
          {
            y: 40,
            opacity: 0,
            scale: 0.97,
            duration: 0.8,
          },
          '-=0.3'
        );

      // ── 2. Hero Preview Card Parallax Scrub on Scroll ──
      if (previewRef.current) {
        gsap.to(previewRef.current, {
          scrollTrigger: {
            trigger: previewRef.current,
            start: 'top 60%',
            end: 'bottom top',
            scrub: 1.2,
          },
          y: -25,
          scale: 0.98,
          opacity: 0.92,
          ease: 'none',
        });
      }

      // ── 3. Product Story Section: Header & Staggered Cards ──
      if (storySectionRef.current) {
        // Section Header Reveal
        gsap.from('.story-header', {
          scrollTrigger: {
            trigger: storySectionRef.current,
            start: 'top 85%',
          },
          y: 35,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
        });

        // 3 Story Cards Staggered Rise
        gsap.from('.story-card', {
          scrollTrigger: {
            trigger: storySectionRef.current,
            start: 'top 75%',
          },
          y: 50,
          scale: 0.95,
          opacity: 0,
          duration: 0.75,
          stagger: 0.18,
          ease: 'power3.out',
        });
      }

      // ── 4. BYOK Section: Left Content & 2x2 Grid ──
      if (byokSectionRef.current) {
        // Left column text slide
        gsap.from('.byok-text-col', {
          scrollTrigger: {
            trigger: byokSectionRef.current,
            start: 'top 80%',
          },
          x: -35,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out',
        });

        // Checklist items cascade
        gsap.from('.byok-check-item', {
          scrollTrigger: {
            trigger: byokSectionRef.current,
            start: 'top 75%',
          },
          x: -20,
          opacity: 0,
          duration: 0.5,
          stagger: 0.12,
          ease: 'power2.out',
        });

        // Right 4 Cards Staggered Rise
        gsap.from('.byok-card', {
          scrollTrigger: {
            trigger: byokSectionRef.current,
            start: 'top 75%',
          },
          y: 40,
          scale: 0.94,
          opacity: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power3.out',
        });
      }

      // ── 5. FAQ Section Reveal ──
      if (faqSectionRef.current) {
        gsap.from('.faq-header', {
          scrollTrigger: {
            trigger: faqSectionRef.current,
            start: 'top 85%',
          },
          y: 35,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
        });

        gsap.from('.faq-item', {
          scrollTrigger: {
            trigger: faqSectionRef.current,
            start: 'top 80%',
          },
          y: 30,
          opacity: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: 'power3.out',
        });
      }

      // Refresh ScrollTrigger after DOM stabilizes
      setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden relative"
    >
      {/* ── Top Scroll Progress Bar ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-indigo-400 origin-left z-50 pointer-events-none shadow-[0_0_8px_rgba(139,92,246,0.5)]"
        style={{ scaleX }}
      />

      {/* ── Subtle Background Architectural Grid ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800c_1px,transparent_1px),linear-gradient(to_bottom,#8080800c_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(139,92,246,0.15),transparent)] pointer-events-none -z-10" />

      {/* Top Navigation Bar: High-Fidelity Navigation-1 */}
      <MarketingHeader isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="pt-10 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 max-w-5xl mx-auto w-full text-center flex flex-col items-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-950/80 border border-brand-700/60 text-brand-300 text-[11px] sm:text-xs font-display font-semibold mb-5 sm:mb-6 max-w-full backdrop-blur-xs">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shrink-0" />
          <span className="truncate">Free &amp; Open BYOK Alternative to Google NotebookLM</span>
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
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3 sm:py-3.5 font-display"
              >
                Continue to Notebooks <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto shadow-xl shadow-brand-600/30 text-sm sm:text-base py-3 sm:py-3.5 font-display"
                >
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/sign-in" className="w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base py-3 sm:py-3.5 font-display"
                >
                  Sign In to Existing Account
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Interactive Hero Card Preview (Enhanced with Scroll Parallax) */}
        <div ref={previewRef} className="mt-8 sm:mt-14 w-full max-w-4xl will-change-transform">
          <Card className="p-4 sm:p-6 md:p-8 bg-surface-raised/50 backdrop-blur-md border-border text-left shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-brand-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-border">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                </div>
                <span className="ml-1 text-[11px] sm:text-xs font-mono text-muted-foreground truncate">
                  Notebook: Distributed Systems &amp; Consensus.pdf
                </span>
              </div>
              <Badge variant="brand" className="self-start sm:self-auto shrink-0 text-[10px] sm:text-xs px-2.5 py-1">
                Grounded Chat with Citations
              </Badge>
            </div>

            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-surface border border-border flex items-center justify-center font-display text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                  Q
                </div>
                <div className="text-xs sm:text-sm font-serif text-foreground/90 bg-surface p-3 sm:p-3.5 rounded-xl border border-border leading-snug sm:leading-normal">
                  How does the Raft consensus algorithm handle split votes during election?
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-600/30 font-bold text-[11px] sm:text-xs mt-0.5">
                  AI
                </div>
                <div className="text-xs sm:text-sm font-serif text-foreground bg-surface-raised p-3 sm:p-4 rounded-xl border border-brand-500/20 leading-relaxed">
                  When a split vote occurs, election timeouts are randomized across candidate nodes{' '}
                  <span className="citation-chip cursor-pointer inline-block my-0.5 hover:scale-105 transition-transform">
                    [1] Ongaro &amp; Ousterhout §5.2
                  </span>
                  . This ensures that one candidate times out before the others, initiates a new
                  election term, and receives the quorum vote before another split can occur{' '}
                  <span className="citation-chip cursor-pointer inline-block my-0.5 hover:scale-105 transition-transform">
                    [2] Raft Paper Fig. 4
                  </span>
                  .
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Product Story Section (Clean Staggered Scroll Animation, No Pin Overlap) */}
      <section
        ref={storySectionRef}
        className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full relative z-10 border-t border-border"
      >
        <div className="story-header text-center mb-8 sm:mb-12">
          <Badge variant="brand" className="mb-3">
            Product Story
          </Badge>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            From Raw Sources to Synthesized Mastery
          </h2>
          <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm">
            Watch how Learning Partner grounds knowledge and produces rich interactive studio outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Step 1 Mockup */}
          <Card className="story-card p-4 sm:p-6 bg-surface-raised border-border flex flex-col justify-between hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg">
            <div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-950 border border-brand-700/60 flex items-center justify-center text-brand-300 font-display font-bold mb-3 sm:mb-4 text-sm sm:text-base">
                1
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground mb-1.5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Upload Sources
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Ingest lecture PDFs, DOCX slides, web articles, and personal markdown notes.
              </p>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border text-[11px] font-mono text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Lecture-04.pdf</span>
                <span className="text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>MIT-Notes.docx</span>
                <span className="text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span>arxiv.org/abs/...</span>
                <span className="text-emerald-400">Ready</span>
              </div>
            </div>
          </Card>

          {/* Step 2 Mockup */}
          <Card className="story-card p-4 sm:p-6 bg-surface-raised border-brand-500/40 flex flex-col justify-between shadow-xl hover:border-brand-500/60 hover:-translate-y-1 transition-all duration-300">
            <div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white font-display font-bold mb-3 sm:mb-4 shadow-md text-sm sm:text-base">
                2
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground mb-1.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Grounded Chat &amp; Citations
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Ask anything. Every response cites exact passages with zero hallucinated fluff.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-xs font-serif leading-snug">
              <p className="text-foreground">
                &quot;The primary invariant is that raft log entries are committed strictly in sequential order [1]...&quot;
              </p>
              <span className="inline-block mt-2 text-[10px] font-mono text-brand-400 bg-brand-950/40 px-2 py-0.5 rounded border border-brand-500/30">
                [1] Section 3.2 Page 14
              </span>
            </div>
          </Card>

          {/* Step 3 Mockup */}
          <Card className="story-card p-4 sm:p-6 bg-surface-raised border-border flex flex-col justify-between hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-lg">
            <div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-300 font-display font-bold mb-3 sm:mb-4 text-sm sm:text-base">
                3
              </div>
              <h3 className="font-display font-bold text-sm sm:text-base text-foreground mb-1.5 flex items-center gap-2">
                <Headphones className="w-4 h-4 text-purple-400" />
                Studio &amp; Voice Overviews
              </h3>
              <p className="text-xs text-muted-foreground font-serif leading-relaxed mb-4">
                Synthesize quizzes, flip flashcards, mind maps, and 2-host audio podcasts.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
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

      {/* "Bring Your Own Key" Architecture Section */}
      <section
        ref={byokSectionRef}
        id="byok-section"
        className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
          <div className="byok-text-col">
            <Badge variant="brand" className="mb-3">
              True Independence
            </Badge>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
              Bring your own key.<br />Zero token markups.
            </h2>
            <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground font-serif leading-relaxed">
              We never charge recurring subscriptions or mark up token prices. Connect your own API keys from Google Gemini, OpenAI, Anthropic, Groq, or OpenRouter—or run locally on Ollama.
            </p>

            <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 text-xs text-foreground font-display">
              <div className="byok-check-item flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AES-256-GCM zero-knowledge key encryption</span>
              </div>
              <div className="byok-check-item flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero token markups; pay provider at true cost</span>
              </div>
              <div className="byok-check-item flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Google Gemini 1M-token free tier fully supported</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <Key className="w-6 h-6 mx-auto mb-2 text-brand-400" />
              <div className="font-display font-bold text-sm text-foreground">BYOK Architecture</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif">
                Direct provider connection without middleman paywalls
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
              <div className="font-display font-bold text-sm text-foreground">Zero Retention</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif">
                Encrypted in Neon Postgres with per-user isolation
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <Zap className="w-6 h-6 mx-auto mb-2 text-amber-400" />
              <div className="font-display font-bold text-sm text-foreground">Fastest Models</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif">
                Gemini 3.8 Flash, Claude 3.5 Sonnet, GPT-4o
              </p>
            </Card>
            <Card className="byok-card p-4 sm:p-5 bg-surface text-center hover:border-brand-500/40 hover:-translate-y-1 transition-all duration-300 shadow-sm">
              <Headphones className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="font-display font-bold text-sm text-foreground">Studio Voice</div>
              <p className="mt-1 text-[11px] text-muted-foreground font-serif">
                2-host podcasts &amp; solo narration with live captions
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section with Staggered Scroll & Smooth Accordion */}
      <section
        ref={faqSectionRef}
        id="faq-section"
        className="py-14 sm:py-24 px-4 sm:px-6 max-w-4xl mx-auto w-full border-t border-border relative z-10"
      >
        <div className="faq-header text-center mb-8 sm:mb-12">
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
                className="faq-item rounded-2xl bg-surface border border-border overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-4 font-display font-bold text-xs sm:text-sm text-foreground hover:text-brand-400 transition-colors cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-400' : 'text-muted-foreground'
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs font-serif text-muted-foreground leading-relaxed border-t border-border/50">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modern High-Fidelity Footer with Social Handles */}
      <MarketingFooter />
    </div>
  );
}
