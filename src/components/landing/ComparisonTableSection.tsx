'use client';

import React from 'react';
import { Badge } from '@/components/ui';
import { Check, X, Minus } from 'lucide-react';

const COMPARISON_ROWS = [
  {
    feature: 'Strict Grounded Citations with Bracketed Chips',
    learningPartner: true,
    genericAi: false,
    paidWrappers: 'Partial',
    note: 'Learning Partner verifies each sentence against ingested chunk vectors.',
  },
  {
    feature: 'Absence-of-Information Rule (No Guessing)',
    learningPartner: true,
    genericAi: false,
    paidWrappers: false,
    note: 'Refuses to answer when facts are absent from your uploaded sources.',
  },
  {
    feature: 'Zero Token Markup (True BYOK Architecture)',
    learningPartner: true,
    genericAi: false,
    paidWrappers: false,
    note: 'Direct provider connection. You pay true API cost or use free tiers.',
  },
  {
    feature: 'Google Gemini 1M Free Tier Support',
    learningPartner: true,
    genericAi: false,
    paidWrappers: false,
    note: '1 million token context window at $0 monthly cost.',
  },
  {
    feature: 'Two-Host Audio Podcasts (Alex & Jordan)',
    learningPartner: true,
    genericAi: false,
    paidWrappers: 'Paid add-on',
    note: 'Generates conversational studio podcasts with customizable voices.',
  },
  {
    feature: 'Local & Offline Models (Ollama Support)',
    learningPartner: true,
    genericAi: false,
    paidWrappers: false,
    note: 'Route inferences locally without sending data over the internet.',
  },
  {
    feature: 'Client-Side Key Encryption (AES-256-GCM)',
    learningPartner: true,
    genericAi: 'N/A',
    paidWrappers: false,
    note: 'Plaintext keys are never logged or stored unencrypted.',
  },
];

export function ComparisonTableSection() {
  return (
    <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10">
      <div className="text-center mb-10 sm:mb-14">
        <Badge variant="neutral" className="mb-3">
          Honest Architecture
        </Badge>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Why Grounded Independence Matters
        </h2>
        <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm max-w-xl mx-auto">
          Compare Learning Partner against generic chat assistants and closed monthly subscription services.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-raised font-display text-xs font-bold text-foreground">
              <th className="p-4 sm:p-5 w-1/2">Capability</th>
              <th className="p-4 sm:p-5 text-center text-brand-400 bg-brand-500/10 border-x border-brand-500/20">
                Learning Partner
              </th>
              <th className="p-4 sm:p-5 text-center text-muted-foreground hidden sm:table-cell">
                Generic ChatGPT
              </th>
              <th className="p-4 sm:p-5 text-center text-muted-foreground hidden md:table-cell">
                $20/mo SaaS Wrappers
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-serif text-xs">
            {COMPARISON_ROWS.map((row, idx) => (
              <tr key={idx} className="hover:bg-surface-raised/40 transition-colors">
                <td className="p-4 sm:p-5">
                  <div className="font-display font-semibold text-foreground text-xs sm:text-sm">
                    {row.feature}
                  </div>
                  <div className="text-muted-foreground text-[11px] mt-0.5">
                    {row.note}
                  </div>
                </td>
                <td className="p-4 sm:p-5 text-center bg-brand-500/5 border-x border-brand-500/20">
                  {row.learningPartner === true ? (
                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500/20 text-brand-400">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>
                  ) : null}
                </td>
                <td className="p-4 sm:p-5 text-center hidden sm:table-cell text-muted-foreground">
                  {row.genericAi === true ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : row.genericAi === false ? (
                    <X className="w-4 h-4 text-error/60 mx-auto" />
                  ) : (
                    <span className="text-[11px] font-mono">{row.genericAi}</span>
                  )}
                </td>
                <td className="p-4 sm:p-5 text-center hidden md:table-cell text-muted-foreground">
                  {row.paidWrappers === true ? (
                    <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                  ) : row.paidWrappers === false ? (
                    <X className="w-4 h-4 text-error/60 mx-auto" />
                  ) : (
                    <span className="text-[11px] font-mono text-amber-400">{row.paidWrappers}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
