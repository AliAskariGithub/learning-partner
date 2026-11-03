'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ChevronDown,
  Sparkles,
  StopCircle,
  Clock,
  CheckCircle2,
  Square,
} from 'lucide-react';
import { ThoughtTimelineStep } from '@/db/schema';
import { Shimmer } from '@/components/ai-elements';

export interface ResponseProgressProps {
  isStreaming: boolean;
  currentPhase?: string;
  elapsedSeconds?: number;
  timeline?: ThoughtTimelineStep[];
  reasoningSummary?: string | null;
  onStop?: () => void;
  className?: string;
}

export function ResponseProgress({
  isStreaming,
  currentPhase = 'Thinking',
  elapsedSeconds = 0,
  timeline = [],
  reasoningSummary,
  onStop,
  className = '',
}: ResponseProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [seconds, setSeconds] = useState(elapsedSeconds);

  // Live timer while streaming
  useEffect(() => {
    if (!isStreaming) {
      setSeconds(elapsedSeconds);
      return;
    }
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming, elapsedSeconds]);

  // If streaming is active, show clean borderless phase indicator (no double box, no nested stop button)
  if (isStreaming) {
    return (
      <div
        className={`flex items-center gap-2.5 py-1 text-xs text-zinc-900 dark:text-[#f4f4f2] mb-2.5 animate-in fade-in duration-200 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 shrink-0">
          <Brain className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-medium text-brand-700 dark:text-brand-300 text-xs shrink-0 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <Shimmer className="text-brand-700 dark:text-brand-200 font-semibold">{currentPhase}</Shimmer>
          </span>
          <span className="text-[11px] font-mono text-zinc-500 dark:text-[#9a9a94] shrink-0">
            ({seconds}s)
          </span>
        </div>
      </div>
    );
  }

  // If not streaming and we have either reasoning summary or timeline steps:
  const hasDetails = (timeline && timeline.length > 0) || Boolean(reasoningSummary);
  if (!hasDetails && seconds <= 0) return null;

  const durationText = seconds > 0 ? `Thought for ${seconds}s` : 'Thinking process';

  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-zinc-100/80 text-xs text-zinc-900 dark:border-[#303030]/80 dark:bg-[#1e1e1e]/60 dark:text-[#f4f4f2] mb-3 overflow-hidden transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-left text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50 dark:text-[#9a9a94] dark:hover:text-[#f4f4f2] dark:hover:bg-[#252525]/50 transition-colors cursor-pointer"
        aria-expanded={isExpanded}
        aria-label="Toggle thinking timeline and reasoning summary"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400/80" />
          <span className="font-display text-[11px] font-medium text-zinc-700 dark:text-[#c0c0be]">
            {durationText}
          </span>
          {timeline.length > 0 && (
            <span className="text-[10px] text-zinc-500 dark:text-[#70706b] font-mono">
              ({timeline.length} {timeline.length === 1 ? 'phase' : 'phases'})
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 dark:text-[#9a9a94] transition-transform duration-200 ${
            isExpanded ? 'rotate-180 text-brand-600 dark:text-brand-400' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-zinc-200 dark:border-[#2a2a2a] p-3 space-y-3 bg-zinc-50 dark:bg-[#191919]/80"
          >
            {/* Timeline Steps */}
            {timeline.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-display font-semibold uppercase tracking-wider text-zinc-500 dark:text-[#757570]">
                  Pipeline Timeline
                </div>
                <div className="space-y-1 pl-1">
                  {timeline.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] font-sans text-zinc-700 dark:text-[#c8c8c5]"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400/80 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-zinc-900 dark:text-[#f4f4f2]">{step.phase}</span>
                        {step.detail && (
                          <span className="text-zinc-500 dark:text-[#9a9a94] ml-1.5">— {step.detail}</span>
                        )}
                      </div>
                      {step.elapsedMs !== undefined && (
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-[#757570] shrink-0">
                          {Math.round(step.elapsedMs)}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Reasoning Summary if returned */}
            {reasoningSummary && (
              <div className="space-y-1.5 pt-1 border-t border-zinc-200 dark:border-[#2a2a2a]">
                <div className="flex items-center gap-1.5 text-[10px] font-display font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  <Sparkles className="w-3 h-3" />
                  <span>Model Reasoning Summary</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#222222] border border-zinc-200 dark:border-[#2d2d2d] text-xs text-zinc-800 dark:text-[#dcdcd8] font-serif leading-relaxed whitespace-pre-wrap">
                  {reasoningSummary}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

