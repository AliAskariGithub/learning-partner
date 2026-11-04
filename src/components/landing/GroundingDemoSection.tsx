'use client';

import React, { useState } from 'react';
import { Card, Badge } from '@/components/ui';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export function GroundingDemoSection() {
  const [activeScenario, setActiveScenario] = useState<'grounded' | 'absence'>('grounded');

  return (
    <section className="py-14 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-border relative z-10">
      <div className="text-center mb-10 sm:mb-14">
        <Badge variant="brand" className="mb-3">
          Verifiable Truth
        </Badge>
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          How Grounded Retrieval Stops Hallucinations
        </h2>
        <p className="mt-2 text-muted-foreground font-serif text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Generic AI models guess when they don’t know. Learning Partner executes chunk-level semantic retrieval, enforces strict absence-of-information rules, and provides verifiable citation chips.
        </p>

        {/* Scenario Switcher */}
        <div className="mt-6 inline-flex p-1 rounded-xl bg-surface border border-border text-xs font-display">
          <button
            type="button"
            onClick={() => setActiveScenario('grounded')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeScenario === 'grounded'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Scenario A: Source-Backed Response
          </button>
          <button
            type="button"
            onClick={() => setActiveScenario('absence')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-medium ${
              activeScenario === 'absence'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Scenario B: Absence of Information Rule
          </button>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        {/* Left Pane: The Source Document */}
        <Card className="p-4 sm:p-6 bg-surface border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-mono font-medium text-foreground">
                  Source: OS_Operating_Systems_Ch7.pdf
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-surface-raised px-2 py-0.5 rounded">
                Page 184 · Chunk #42
              </span>
            </div>

            <h4 className="text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
              Ingested Document Chunk
            </h4>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs font-serif leading-relaxed text-muted-foreground">
              {activeScenario === 'grounded' ? (
                <>
                  <p>
                    ...In virtual memory paging systems, the Translation Lookaside Buffer (TLB) operates as a high-speed hardware cache.{' '}
                    <mark className="bg-brand-500/20 text-brand-300 px-1 py-0.5 rounded border border-brand-500/40">
                      When a TLB miss occurs, the page table walk takes approximately 10 to 100 memory cycles depending on multi-level depth.
                    </mark>{' '}
                    Modern x86 processors employ four-level page table hierarchies to address up to 48 bits of virtual address space...
                  </p>
                </>
              ) : (
                <>
                  <p>
                    ...This chapter covers virtual memory, translation lookaside buffers, paging hardware, and segmentation fault interrupts. All discussion pertains exclusively to memory management architectures...
                  </p>
                  <p className="mt-2 text-[11px] text-amber-400/90 italic">
                    (Notice: No information regarding database indexing or B-Trees exists in this source.)
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>SSRF &amp; File Integrity: Verified</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Cleanly Parsed
            </span>
          </div>
        </Card>

        {/* Right Pane: Learning Partner's Output */}
        <Card className={`p-4 sm:p-6 border flex flex-col justify-between ${
          activeScenario === 'grounded'
            ? 'bg-surface-raised/50 border-brand-500/40'
            : 'bg-surface border-border'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="text-xs font-display font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-400" />
                Learning Partner Response
              </span>
              <Badge variant={activeScenario === 'grounded' ? 'brand' : 'neutral'} className="text-[10px]">
                {activeScenario === 'grounded' ? 'Strict Grounding' : 'Absence Rule Triggered'}
              </Badge>
            </div>

            {/* Prompt */}
            <div className="mb-3 text-xs font-serif bg-surface p-2.5 rounded-lg border border-border text-foreground/90">
              <span className="font-display font-bold text-muted-foreground mr-1">Query:</span>
              {activeScenario === 'grounded'
                ? 'What is the performance penalty of a TLB miss according to our notes?'
                : 'How does a B-Tree database index organize nodes?'
              }
            </div>

            {/* Response */}
            <div className="text-xs sm:text-sm font-serif leading-relaxed text-foreground bg-surface/80 p-3.5 rounded-xl border border-border">
              {activeScenario === 'grounded' ? (
                <>
                  <p>
                    According to your lecture notes, a TLB miss incurs a page table walk penalty of{' '}
                    <strong className="text-brand-300">approximately 10 to 100 memory cycles</strong>, depending directly on the depth of the multi-level page table{' '}
                    <span className="citation-chip my-0.5">
                      [1] Ch.7 p.184
                    </span>
                    .
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground font-sans">
                    ✨ Exactly cites the ingested chunk. Zero hallucinations.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-foreground">
                      &quot;I could not find information about B-Tree database indexing in your provided source documents. The active document (<code>OS_Operating_Systems_Ch7.pdf</code>) focuses exclusively on hardware virtual memory and paging.&quot;
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground font-sans">
                    🛡️ Will never invent or confabulate facts when sources lack information.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border text-[11px] font-sans text-muted-foreground flex items-center justify-between">
            <span>Model: Selected BYOK Key</span>
            <span className="text-brand-400 font-display font-medium">100% Deterministic Grounding</span>
          </div>
        </Card>
      </div>
    </section>
  );
}
