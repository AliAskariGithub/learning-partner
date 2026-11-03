'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

export interface InlineMiniCheckProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  onAnswered?: (isCorrect: boolean) => void;
}

export function InlineMiniCheck({
  question,
  options,
  correctIndex,
  explanation,
  onAnswered,
}: InlineMiniCheckProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswered?.(idx === correctIndex);
  };

  const isCorrect = selected === correctIndex;

  return (
    <div className="p-4 rounded-xl bg-[#222222] border border-[#333333] shadow-md text-xs text-[#f4f4f2] space-y-3 my-2.5 max-w-lg">
      <div className="flex items-center gap-2 text-brand-300 font-display font-semibold text-[11px] uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Understanding Check</span>
      </div>

      <p className="font-display font-medium text-xs text-[#f4f4f2] leading-snug">
        {question}
      </p>

      <div className="space-y-1.5">
        {options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isThisCorrect = idx === correctIndex;

          let style = 'bg-[#2a2a2a] hover:bg-[#323232] border-[#383838] text-[#e0e0dc] cursor-pointer';

          if (revealed) {
            if (isThisCorrect) {
              style = 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-semibold';
            } else if (isSelected) {
              style = 'bg-red-950/40 border-red-500 text-red-200 font-semibold';
            } else {
              style = 'bg-[#1e1e1e] border-[#2c2c2c] text-[#70706b] opacity-60';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={revealed}
              onClick={() => handleSelect(idx)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${style}`}
            >
              <span>{opt}</span>
              {revealed && isThisCorrect && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              )}
              {revealed && isSelected && !isThisCorrect && (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-2.5 rounded-lg border text-[11px] leading-relaxed font-serif ${
              isCorrect
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                : 'bg-red-950/20 border-red-800/40 text-red-100'
            }`}
          >
            <div className="font-semibold mb-0.5 font-display">
              {isCorrect ? 'Correct!' : 'Review takeaway:'}
            </div>
            <p>{explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

