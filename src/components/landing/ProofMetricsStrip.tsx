'use client';

import React from 'react';
import { ShieldCheck, Zap, Layers, Lock } from 'lucide-react';

const METRICS = [
  {
    icon: ShieldCheck,
    value: '100% Grounded',
    label: 'Zero Hallucination Tolerance',
    description: 'Every answer strictly cites verified source chunks or admits absence of info.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: Zap,
    value: '0% Token Markup',
    label: 'True BYOK Architecture',
    description: 'Pay providers directly for raw usage, or utilize Google Gemini’s generous free tier.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Layers,
    value: '5+ Model Families',
    label: 'Zero Vendor Lock-In',
    description: 'Run Gemini 2.0, Claude 3.5, GPT-4o, Groq Llama, or offline with Ollama.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Lock,
    value: 'AES-256-GCM',
    label: 'Client-Side Key Encryption',
    description: 'Plaintext API keys are never written to database tables or server log streams.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
];

export function ProofMetricsStrip() {
  return (
    <section className="py-10 sm:py-14 px-4 sm:px-6 max-w-5xl mx-auto w-full relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {METRICS.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div
              key={i}
              className="proof-metric-card p-4 sm:p-5 rounded-2xl bg-surface/80 border border-border hover:border-brand-500/40 transition-all duration-300 shadow-sm flex flex-col justify-between group"
            >
              <div>
                <div className={`w-9 h-9 rounded-xl ${metric.bg} flex items-center justify-center ${metric.color} mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                  {metric.value}
                </div>
                <div className="text-xs font-display font-semibold text-brand-400 mt-0.5">
                  {metric.label}
                </div>
              </div>
              <p className="mt-2.5 text-[11px] sm:text-xs text-muted-foreground font-serif leading-relaxed">
                {metric.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
