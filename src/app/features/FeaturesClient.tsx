'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Badge, Card } from '@/components/ui';
import {
  FileText,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Volume2,
  BookOpen,
  AlignLeft,
  GitFork,
  ScrollText,
  Key,
  Paperclip,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  Headphones,
} from 'lucide-react';

export function FeaturesClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  // Interactive miniature state
  const [activeTab, setActiveTab] = useState<'chat' | 'learn' | 'quiz'>('chat');
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [sourceEnabled, setSourceEnabled] = useState(true);

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* 1. SOURCES FEATURE */}
      <section id="sources" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <Badge variant="neutral" className="mb-2">Document Ingestion</Badge>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
              Multi-Format Source Grounding
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">Up to 25MB • 50 sources/notebook</span>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Grounding requires reliable text extraction. Learning Partner accepts research PDFs, Microsoft Word (.docx), Markdown (.md), plain text notes (.txt), and live web URLs with built-in SSRF protection.
        </p>

        {/* Miniature Source UI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={sourceEnabled}
                  onChange={(e) => setSourceEnabled(e.target.checked)}
                  className="mt-1 rounded border-border text-brand-600 focus:ring-brand-500 cursor-pointer"
                  aria-label="Toggle source"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-display font-semibold text-xs sm:text-sm text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-bold">PDF</span>
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">cognitive-psychology-ch4.pdf</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    14,820 words • {sourceEnabled ? (
                      <span className="text-emerald-500 font-semibold">Ready &amp; Active</span>
                    ) : (
                      <span className="text-muted-foreground italic">Disabled</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-serif text-muted-foreground flex items-center justify-between">
              <span>Indexed into 22 semantic chunks</span>
              <span className="text-brand-500 font-mono text-[10px]">Dual FTS + Vector</span>
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="mt-1 rounded border-border text-brand-600 focus:ring-brand-500"
                  aria-label="Source ready"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-display font-semibold text-xs sm:text-sm text-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">URL</span>
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">https://arxiv.org/abs/2309.xxxx</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground mt-1">
                    8,450 words • <span className="text-emerald-500 font-semibold">Ready &amp; Active</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-serif text-muted-foreground flex items-center justify-between">
              <span>Sanitized against SSRF attacks</span>
              <span className="text-brand-500 font-mono text-[10px]">Safe Public Target</span>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. CITED ANSWERS FEATURE */}
      <section id="citations" className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <Badge variant="neutral" className="mb-2">Verifiable Answers</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Verifiable Citation Chips
          </h2>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Instead of vague responses, Learning Partner inserts bracketed citation chips linking directly to the underlying passages. Clicking a chip reveals the exact excerpt, page number, and source file.
        </p>

        {/* Miniature Citation UI */}
        <Card className="p-5 sm:p-6 bg-surface border-border space-y-4">
          <div className="text-xs font-mono text-brand-500 uppercase tracking-wider font-semibold">
            Assistant Grounded Response
          </div>
          <div className="font-serif text-sm sm:text-base text-foreground leading-relaxed space-y-3">
            <p>
              According to Miller’s law, working memory capacity in human adults is traditionally characterized by seven plus or minus two chunks of information{' '}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono text-xs font-bold border border-brand-500/20 cursor-pointer hover:bg-brand-500/20">
                [1]
              </span>
              . However, modern neuroimaging studies cited in section 4.2 suggest that active manipulation of visual-spatial tokens often saturates closer to four distinct objects{' '}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono text-xs font-bold border border-brand-500/20 cursor-pointer hover:bg-brand-500/20">
                [2]
              </span>
              .
            </p>
          </div>

          {/* Citation Inspector Drawer */}
          <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs font-serif space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
              <span className="font-semibold text-foreground">Citation [1] Inspector</span>
              <span>cognitive-psychology-ch4.pdf • Page 84</span>
            </div>
            <p className="text-muted-foreground italic pl-3 border-l-2 border-brand-500 text-xs">
              &ldquo;...demonstrated that the span of absolute judgment and immediate memory is bounded by approximately seven discrete items across auditory and visual stimuli.&rdquo;
            </p>
          </div>
        </Card>
      </section>

      {/* 3. THE THREE MODES */}
      <section id="modes" className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <Badge variant="neutral" className="mb-2">Pedagogy</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Three Tailored Study Modes
          </h2>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Select between three interaction modes depending on your study objective:
        </p>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          {(['chat', 'learn', 'quiz'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setActiveTab(mode)}
              className={`px-4 py-2 rounded-xl font-display font-semibold text-xs sm:text-sm capitalize transition-all cursor-pointer ${
                activeTab === mode
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-surface text-muted-foreground hover:text-foreground'
              }`}
            >
              {mode} Mode
            </button>
          ))}
        </div>

        {/* Active Mode Interactive Demo */}
        {activeTab === 'chat' && (
          <Card className="p-5 bg-surface border-border space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-xs font-display font-bold text-foreground">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Chat Mode: Analytical Synthesis
            </div>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground">
              Delivers objective, direct answers with citation chips. Ideal for rapid literature reviews, formula verification, and finding specific definitions in 200-page textbooks.
            </p>
          </Card>
        )}

        {activeTab === 'learn' && (
          <Card className="p-5 bg-surface border-border space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-display font-bold text-foreground">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Learning Mode: Socratic Tutor &amp; Image Uploads
              </div>
              <Badge variant="neutral" className="text-[10px]">Requires Vision Model</Badge>
            </div>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground">
              Instead of giving you the answers immediately, the tutor asks guiding questions. You can attach photographs of textbook exercises or handwritten notes via the paperclip icon.
            </p>
            <div className="p-3 rounded-xl bg-surface-raised border border-border/80 flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-2">
                <Paperclip className="w-3.5 h-3.5 text-brand-500" />
                calculus-integral-diagram.png (Uploaded)
              </span>
              <span className="text-emerald-500 font-semibold">Magic Bytes Validated</span>
            </div>
          </Card>
        )}

        {activeTab === 'quiz' && (
          <Card className="p-5 bg-surface border-border space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-display font-bold text-foreground">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Quiz Mode: Active Recall &amp; Instant Scoring
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">Live Interactive Demo</span>
            </div>

            <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
              <div className="font-display font-semibold text-xs sm:text-sm text-foreground">
                Question: What prevents Learning Partner from hallucinating answers?
              </div>
              <div className="space-y-2">
                {[
                  { id: 0, text: 'Strict passage retrieval + absence-of-information rule', correct: true },
                  { id: 1, text: 'Relying exclusively on the model’s pre-training weights', correct: false },
                  { id: 2, text: 'Disabling web browsing and increasing temperature', correct: false },
                ].map((option) => {
                  const isSelected = selectedQuizOption === option.id;
                  let style = 'bg-surface border-border hover:border-brand-500/60 text-foreground';
                  if (isSelected) {
                    style = option.correct
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-semibold';
                  }

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedQuizOption(option.id)}
                      className={`w-full p-2.5 text-left rounded-lg border text-xs font-serif transition-colors flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <span>{option.text}</span>
                      {isSelected && (
                        <span>
                          {option.correct ? <Check className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-rose-500" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedQuizOption !== null && (
                <div className="text-[11px] font-serif text-muted-foreground pt-1">
                  {selectedQuizOption === 0 ? (
                    <span className="text-emerald-500 font-semibold">Correct! Exact citation chips tie each claim to your sources.</span>
                  ) : (
                    <span className="text-rose-500 font-semibold">Not quite. The absence-of-information rule forces the model to concede when sources lack the answer.</span>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </section>

      {/* 4. STUDIO SYNTHESIZERS */}
      <section id="studio" className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <Badge variant="neutral" className="mb-2">Artifact Generation</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            The 7 Studio Synthesizers
          </h2>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Generate structured, multi-page study artifacts from your enabled sources with one click:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                <Volume2 className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Voice Audio Overview</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Natural dialogue between co-hosts Alex and Jordan discussing your documents, powered by Gemini/OpenAI TTS.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Audio • Browser Fallback
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Interactive Quiz</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Active recall test with instant explanations, answer key, and topic difficulty scoring.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Structured JSON Schema
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Flashcards</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Spaced recall cards with front/back click flip for definitions, theorems, and key dates.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Flippable Deck
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-3">
                <BookOpen className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Study Guide</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Formatted serif curriculum breaking down key terms, core principles, and sample test prompts.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Structured Curriculum
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3">
                <GitFork className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Mind Map</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Zoomable, collapsible hierarchical concept tree visualizing relationships across sources.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Interactive Graph
            </div>
          </Card>

          <Card className="p-4 bg-surface border-border flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                <ScrollText className="w-4 h-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1">Report &amp; Summary</h3>
              <p className="font-serif text-xs text-muted-foreground">
                Formal academic briefing with footnotes, or concise executive summaries for fast review.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-border/40 text-[10px] font-mono text-brand-500">
              Formal Briefing
            </div>
          </Card>
        </div>
      </section>

      {/* 5. SHARED NOTEBOOK MEMORY */}
      <section id="memory" className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <Badge variant="neutral" className="mb-2">Persistent Context</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Shared Notebook Memory
          </h2>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Conversations don&apos;t live in silos. As you study across multiple sessions, a background worker consolidates what you have mastered and which topics require reinforcement.
        </p>

        <Card className="p-5 bg-surface border-border space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
            <span className="text-foreground font-semibold">Active Memory Observations (3 items)</span>
            <span className="text-emerald-500 font-semibold">Auto-consolidated</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs font-serif text-foreground flex items-center justify-between">
              <span>Understands Bayesian probability updates; struggles with conditional independence.</span>
              <span className="text-[10px] font-mono text-amber-500">Reinforce</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs font-serif text-foreground flex items-center justify-between">
              <span>Mastered single-variable calculus derivations in Chapter 2.</span>
              <span className="text-[10px] font-mono text-emerald-500">Mastered</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-raised border border-border text-xs font-serif text-foreground flex items-center justify-between">
              <span>Prefers explanations structured with concrete code snippets.</span>
              <span className="text-[10px] font-mono text-brand-500">Preference</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. MODEL CAPABILITIES & HONEST GATING */}
      <section id="capabilities" className="space-y-6">
        <div className="border-b border-border/60 pb-4">
          <Badge variant="neutral" className="mb-2">Capability Gating</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Honest Model Capability Rules
          </h2>
        </div>

        <p className="font-serif text-sm sm:text-base text-muted-foreground leading-relaxed">
          Not all AI models are capable of every task. Rather than letting requests fail silently, Learning Partner uses capability gating to inform you upfront:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="font-display font-semibold text-xs sm:text-sm text-foreground">Vision Uploads</div>
            <p className="font-serif text-xs text-muted-foreground">
              Requires a multimodal vision-enabled model (e.g. Gemini 3.8 Flash, GPT-4o, Claude 3.5 Sonnet). Disabled automatically if using text-only endpoints.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="font-display font-semibold text-xs sm:text-sm text-foreground">Structured Quizzes</div>
            <p className="font-serif text-xs text-muted-foreground">
              Requires support for structured JSON schema response formats to ensure questions and choices render interactively without syntax corruptions.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
            <div className="font-display font-semibold text-xs sm:text-sm text-foreground">Voice Overview</div>
            <p className="font-serif text-xs text-muted-foreground">
              Requires a Google Gemini or OpenAI key for cloud speech synthesis, or you can switch to the zero-key Basic Voice browser fallback.
            </p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="text-center py-6 border-t border-border space-y-4">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
          Ready to experience grounded study?
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

