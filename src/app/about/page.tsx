import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Button, Card, Badge } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  BookOpen,
  ShieldCheck,
  Cpu,
  BrainCircuit,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Layers,
  CheckCircle,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `About — ${siteConfig.name}`,
  description:
    'Learn about our mission to provide a free, open-source, bring-your-own-AI study workspace strictly grounded in your own documents.',
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
};

export default async function AboutPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    founder: {
      '@type': 'Person',
      name: siteConfig.owner.displayName,
    },
    description: siteConfig.description,
  };

  return (
    <PageShell
      title="Study with Truth, Not Hallucinations"
      intro="Learning Partner is an open-source, bring-your-own-AI study workspace designed to turn scattered lecture slides, textbook chapters, and research papers into verifiable knowledge."
      badge="About Learning Partner"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-12 sm:space-y-16">
        {/* Mission Section */}
        <section className="space-y-4">
          <Badge variant="neutral">Our Core Mission</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            A Free, Bring-Your-Own-AI Workspace for Serious Learners
          </h2>
          <p className="font-serif text-muted-foreground leading-relaxed text-sm sm:text-base">
            General-purpose AI chatbots are trained to be agreeable and generative, which makes them dangerous for studying. When asked a complex technical or historical question, they often generate plausible-sounding falsehoods ("hallucinations").
          </p>
          <p className="font-serif text-muted-foreground leading-relaxed text-sm sm:text-base">
            Learning Partner was engineered around a foundational constraint:{' '}
            <strong className="text-foreground font-semibold">
              every single answer must be strictly derived from the sources you enable
            </strong>. If your uploaded documents do not contain the answer, our system tells you immediately rather than guessing.
          </p>
        </section>

        {/* The Problem We Solve */}
        <section className="space-y-6">
          <Badge variant="neutral">The Problem</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            What Learners Face Today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-5 sm:p-6 bg-surface border-border flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">
                  Scattered Study Assets
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Students juggle 80-page slide decks, syllabi PDFs, handwritten notes, and online articles across disconnected apps without searchability.
                </p>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 bg-surface border-border flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">
                  Costly SaaS Subscriptions
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Most study tools charge $20+/month for black-box wrappers while locking users into closed ecosystems and restrictive per-document limits.
                </p>
              </div>
            </Card>

            <Card className="p-5 sm:p-6 bg-surface border-border flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-base text-foreground mb-2">
                  Unverifiable Answers
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Standard chatbots synthesize answers without citations. Students spend precious study time manually hunting for page numbers to verify claims.
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* What Makes Us Different */}
        <section className="space-y-6">
          <Badge variant="neutral">The Architecture</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            What Makes Learning Partner Different
          </h2>
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-surface border border-border flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5 font-display font-bold text-sm">
                1
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground mb-1">
                  Verifiable Grounded Citations
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Every claim links to an exact passage in your document via clickable citation chips. You can verify sources with one click.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5 font-display font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground mb-1">
                  Three Pedagogical Modes
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Switch between analytical <strong>Chat</strong>, Socratic <strong>Learning</strong> with textbook photo uploads, and active recall <strong>Quiz</strong> mode with live scoring.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5 font-display font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground mb-1">
                  Shared Notebook Memory
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Your study partner consolidates key insights, strengths, and weaknesses between conversations, so you never have to re-explain your background.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-surface border border-border flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5 font-display font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-foreground mb-1">
                  You Choose Your AI (BYOK)
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Use Google Gemini’s free tier, your OpenAI or Anthropic API keys, Groq, or self-hosted models. Your keys are encrypted client-side with AES-256-GCM.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="space-y-4">
          <Badge variant="neutral">Target Audience</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Who It&apos;s For
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-sm text-foreground">University &amp; College Students</h4>
                <p className="font-serif text-xs text-muted-foreground mt-0.5">
                  Preparing for exams from heavy course syllabi, lecture slides, and academic textbooks.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-sm text-foreground">STEM &amp; Medical Researchers</h4>
                <p className="font-serif text-xs text-muted-foreground mt-0.5">
                  Synthesizing clinical trials and preprints where hallucinated citations cannot be tolerated.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-sm text-foreground">Professional Certification Candidates</h4>
                <p className="font-serif text-xs text-muted-foreground mt-0.5">
                  Studying for Bar exams, USMLE, CPA, CFA, or cloud architecture certifications.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-display font-semibold text-sm text-foreground">Self-Directed Lifelong Learners</h4>
                <p className="font-serif text-xs text-muted-foreground mt-0.5">
                  Anyone tackling dense non-fiction literature, technical manuals, or historical primary texts.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who Builds It */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <Badge variant="neutral">Maintainer</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Who Builds Learning Partner
          </h2>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Learning Partner was created and is actively maintained by{' '}
            <strong className="text-foreground">{siteConfig.owner.displayName}</strong> as an independent open-source initiative. We do not have outside venture capital, sales teams, or advertising models. The platform exists to demonstrate that high-performance, private educational AI can be made transparent and accessible to everyone.
          </p>
        </section>

        {/* Call to Action */}
        <section className="text-center py-6 sm:py-8 border-t border-border space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Ready to study with verifiable citations?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/app">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Open Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/sign-up">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    Explore Features Tour
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

