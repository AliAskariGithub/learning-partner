'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button, Badge, Card } from '@/components/ui';
import {
  UploadCloud,
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  Database,
  Search,
  CheckCircle,
  FileText,
  AlertCircle,
  Sliders,
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function HowItWorksClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.from('.step-card', {
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-16 sm:space-y-24">
      {/* 3 STEPS STORYTELLING */}
      <section className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge variant="neutral">The 3-Step Journey</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Simple to Use, Transparent by Design
          </h2>
        </div>

        <div className="space-y-6">
          {/* Step 1 */}
          <Card className="step-card p-6 sm:p-8 bg-surface border-border flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-display font-extrabold text-lg shrink-0">
              1
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-brand-500" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                  Add Your Sources
                </h3>
              </div>
              <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Upload your lecture PDFs, syllabi, course slides, Word documents, Markdown files, or paste public web URLs. Your raw files are parsed into clean text, stripped of layout junk, and indexed into manageable passages.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">PDF (.pdf)</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Word (.docx)</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Markdown (.md)</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Web URLs</span>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card className="step-card p-6 sm:p-8 bg-surface border-border flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-display font-extrabold text-lg shrink-0">
              2
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <MessageSquareQuote className="w-4 h-4 text-indigo-500" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                  Ask, Learn, or Get Quizzed
                </h3>
              </div>
              <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose your mode: <strong>Chat</strong> for direct factual synthesis, <strong>Learn</strong> for step-by-step Socratic guidance with textbook photos, or <strong>Quiz</strong> for active recall with instant grading. The AI responds referencing only the sources you have active.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Verifiable Citations [1]</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Absence-of-Information Rule</span>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card className="step-card p-6 sm:p-8 bg-surface border-border flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-display font-extrabold text-lg shrink-0">
              3
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
                  Study with Studio Synthesizers
                </h3>
              </div>
              <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Transform your sources into comprehensive study guides, spaced recall flashcards, interactive mind maps, or listen to a 2-host audio podcast overview between Alex and Jordan on your commute.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-muted-foreground">
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Voice Overview</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Flashcards Deck</span>
                <span className="px-2 py-0.5 rounded bg-surface-raised border border-border">Curriculum Guide</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* UNDER THE HOOD EXPLANATION */}
      <section className="space-y-8 border-t border-border/60 pt-12">
        <div className="space-y-3">
          <Badge variant="neutral">Retrieval-Augmented Generation</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Under the Hood: Plain Language
          </h2>
          <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
            How does Learning Partner prevent hallucinations? Here is the exact technical pipeline in plain terms:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-base text-foreground">
              1. Passage Splitting (Chunking)
            </h4>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Long documents are split into logical passages of roughly 800 tokens. A 100-token overlap between passages ensures that concepts spanning a sentence boundary are never severed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-base text-foreground">
              2. Dual Index Retrieval
            </h4>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
              When you ask a question, our server performs both a full-text database search (for exact formulas and names) and a semantic vector search (for conceptual meaning), returning only the top relevant excerpts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-base text-foreground">
              3. Strict Prompt Grounding
            </h4>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The retrieved excerpts are passed to the AI model alongside strict system instructions: &ldquo;Answer strictly using these provided excerpts. If the information is not present, state that you cannot find it.&rdquo;
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-display font-bold text-base text-foreground">
              4. Bracketed Citation Extraction
            </h4>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
              As the AI streams its answer, our citation parser detects bracketed citations like [1] or [1, 2] and links them directly to the underlying chunk ID, title, and page number for interactive inspection.
            </p>
          </div>
        </div>

        {/* Honest Accuracy Disclaimer */}
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs font-serif space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-display font-bold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Honest Disclosure on AI Accuracy
          </div>
          <p className="text-muted-foreground leading-relaxed">
            While grounded retrieval dramatically reduces falsehoods, large language models can still misinterpret mathematical notation, misread scientific nuance, or omit crucial caveats. Learning Partner is an educational study tool designed to accelerate your review—not a substitute for verifying primary sources. Always check citations before exams or clinical work.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-6 border-t border-border space-y-4">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          Ready to try it on your own documents?
        </h2>
        <div className="flex items-center justify-center gap-3">
          {isLoggedIn ? (
            <Link href="/app">
              <Button variant="primary" size="lg">
                Open Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/sign-up">
              <Button variant="primary" size="lg">
                Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

