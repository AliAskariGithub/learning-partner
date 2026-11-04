'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from '@/components/ui';
import {
  Sparkles,
  HelpCircle,
  Headphones,
  FileCheck,
  ArrowRight,
  Shield,
  Layers,
  GraduationCap,
} from 'lucide-react';

const FEATURES = [
  {
    icon: GraduationCap,
    badge: 'Pedagogy',
    title: 'Socratic Learn Mode',
    description:
      'Stops AI from simply doing your homework for you. Guides you step-by-step with probing questions, hints, and feedback on uploaded textbook diagrams.',
    href: '/features',
    color: 'text-brand-400',
    borderHover: 'hover:border-brand-500/50',
    bg: 'bg-brand-500/10',
  },
  {
    icon: HelpCircle,
    badge: 'Cognitive Science',
    title: 'Active Recall Quiz Studio',
    description:
      'Generates conceptual and factual multiple-choice quizzes derived strictly from your lecture notes, with live score updates and detailed answer explanations.',
    href: '/features',
    color: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Headphones,
    badge: 'Audio Synthesis',
    title: 'Conversational Audio Overviews',
    description:
      'Listen to your study materials on the commute. Alex and Jordan debate and synthesize complex topics using Gemini TTS, OpenAI TTS, or free browser voice.',
    href: '/features',
    color: 'text-purple-400',
    borderHover: 'hover:border-purple-500/50',
    bg: 'bg-purple-500/10',
  },
  {
    icon: FileCheck,
    badge: 'Ingestion Engine',
    title: 'Universal Document Ingestion',
    description:
      'Upload PDFs, Microsoft Word (.docx), Markdown (.md), and plain text. Ingest live web URLs with built-in SSRF protection blocking local subnets and private IPs.',
    href: '/features',
    color: 'text-amber-400',
    borderHover: 'hover:border-amber-500/50',
    bg: 'bg-amber-500/10',
  },
];

export function FeatureShowcaseSection() {
  return (
    <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-14">
        <div>
          <Badge variant="brand" className="mb-3">
            Core Capabilities
          </Badge>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            A Complete Workspace for Serious Learners
          </h2>
          <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm max-w-xl">
            Engineered around active recall, citation grounding, and cognitive science instead of superficial summaries.
          </p>
        </div>

        <Link href="/features" className="shrink-0">
          <Button variant="secondary" size="sm" className="gap-1.5 font-display text-xs">
            <span>Explore all features</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <Card
              key={idx}
              className={`feature-showcase-card p-5 sm:p-6 bg-surface border-border flex flex-col justify-between transition-all duration-300 ${feat.borderHover} group`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl ${feat.bg} flex items-center justify-center ${feat.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted-foreground">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base sm:text-lg text-foreground mb-2 group-hover:text-brand-400 transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-serif leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs font-display font-medium text-brand-400">
                <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Learn more in documentation
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
