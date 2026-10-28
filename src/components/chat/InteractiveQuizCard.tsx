'use client';

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Sparkles, RefreshCw, Trophy, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  citationSnippet?: string;
  sourceTitle?: string;
}

export interface QuizData {
  title?: string;
  questions: QuizQuestion[];
}

interface InteractiveQuizCardProps {
  quizData: QuizData;
  onNewQuiz?: () => void;
}

export function InteractiveQuizCard({ quizData, onNewQuiz }: InteractiveQuizCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (revealed[questionId]) return; // locked once answered

    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  };

  const answeredCount = Object.keys(revealed).length;
  const totalQuestions = quizData.questions?.length || 0;

  const correctCount = quizData.questions?.reduce((acc, q) => {
    if (revealed[q.id] && selectedAnswers[q.id] === q.correctIndex) {
      return acc + 1;
    }
    return acc;
  }, 0) || 0;

  return (
    <div className="rounded-2xl bg-[#262626] border border-[#303030] p-5 space-y-5 text-[#f4f4f2] shadow-xl my-3">
      {/* Quiz Header & Running Score */}
      <div className="flex items-center justify-between border-b border-[#303030] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-[#f4f4f2]">
              {quizData.title || 'Interactive Recall Quiz'}
            </h3>
            <p className="text-[10px] text-[#9a9a94] font-serif">
              Grounded in active notebook sources
            </p>
          </div>
        </div>

        {/* Running Score Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#191919] border border-[#303030] text-xs font-mono">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {correctCount} / {answeredCount} correct
          </span>
          {answeredCount === totalQuestions && totalQuestions > 0 && (
            <span className="text-[10px] text-emerald-400 font-bold ml-1">Finished!</span>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {quizData.questions.map((q, qIndex) => {
          const isAnswered = revealed[q.id];
          const selectedOption = selectedAnswers[q.id];
          const isCorrect = isAnswered && selectedOption === q.correctIndex;

          return (
            <div key={q.id || qIndex} className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-mono text-xs text-brand-400 font-bold shrink-0 mt-0.5">
                  Q{qIndex + 1}.
                </span>
                <p className="font-display font-medium text-xs text-[#f4f4f2] leading-snug">
                  {q.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-1.5 pl-6">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isThisCorrect = optIdx === q.correctIndex;

                  let optClass = 'bg-[#191919] border-[#303030] text-[#f4f4f2] hover:bg-[#202020]';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      optClass = 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-medium';
                    } else if (isSelected && !isThisCorrect) {
                      optClass = 'bg-red-950/40 border-red-500/60 text-red-300';
                    } else {
                      optClass = 'bg-[#191919] border-[#303030] opacity-50 text-[#9a9a94]';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${optClass}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && (
                        <span>
                          {isThisCorrect ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          ) : null}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Explanation Feedback */}
              {isAnswered && (
                <div
                  className={`ml-6 p-3 rounded-xl border text-xs space-y-1 animate-in fade-in duration-200 ${
                    isCorrect
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <p className="font-display font-semibold text-[11px]">
                    {isCorrect ? '✓ Correct!' : '✕ Not quite right'}
                  </p>
                  <p className="text-[11px] font-serif leading-relaxed text-[#f4f4f2]/90">
                    {q.explanation}
                  </p>
                  {q.sourceTitle && (
                    <p className="text-[10px] text-[#9a9a94] font-mono pt-1">
                      Source: {q.sourceTitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Quiz Action */}
      {onNewQuiz && (
        <div className="pt-2 border-t border-[#303030] flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={onNewQuiz}
            className="text-xs text-brand-400 hover:text-white border-[#303030]"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            New Quiz
          </Button>
        </div>
      )}
    </div>
  );
}

