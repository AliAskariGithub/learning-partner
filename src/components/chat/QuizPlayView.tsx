'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Flame,
  Clock,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Bookmark,
  ChevronRight,
  BookOpen,
  Award,
  ChevronDown,
} from 'lucide-react';
import { QuizPayload, QuizQuestion } from '@/lib/ai/quiz';
import { Citation } from '@/db/schema';
import { CitationChip } from '@/components/chat/CitationChip';

export interface QuizPlayViewProps {
  quiz: QuizPayload;
  quizId?: string;
  notebookId: string;
  onCompleteAttempt?: (results: {
    quizId: string;
    answers: Record<string, any>;
    perQuestionResults: any[];
    durationSeconds: number;
  }) => Promise<void>;
  onNewQuizOnWeakTopics?: (weakTags: string[]) => void;
  onSaveToStudio?: () => void;
  onCitationClick?: (citation: Citation) => void;
  onClose?: () => void;
}

export function QuizPlayView({
  quiz,
  quizId = 'active-quiz',
  notebookId,
  onCompleteAttempt,
  onNewQuizOnWeakTopics,
  onSaveToStudio,
  onCitationClick,
  onClose,
}: QuizPlayViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | string | number[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [shortAnswerInputs, setShortAnswerInputs] = useState<Record<string, string>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(quiz.questions || []);

  const totalQuestions = activeQuestions.length;
  const currentQ = activeQuestions[currentIndex];

  // Track elapsed timer
  useEffect(() => {
    if (isFinished) return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished]);

  // Compute live score stats
  const answeredCount = Object.keys(revealed).length;
  const correctCount = useMemo(() => {
    return activeQuestions.reduce((acc, q) => {
      if (!revealed[q.id]) return acc;
      const ans = selectedAnswers[q.id];
      if (typeof q.correctIndex === 'number' && ans === q.correctIndex) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [activeQuestions, revealed, selectedAnswers]);

  const liveAccuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 100;

  // Handle answering option
  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (!currentQ || revealed[currentQ.id]) return;

      const isCorrect = optionIndex === currentQ.correctIndex;
      setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionIndex }));
      setRevealed((prev) => ({ ...prev, [currentQ.id]: true }));

      if (isCorrect) {
        setCurrentStreak((prev) => {
          const next = prev + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setCurrentStreak(0);
      }
    },
    [currentQ, revealed]
  );

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);

      // Assemble attempt results
      const perQuestionResults = activeQuestions.map((q) => {
        const userAns = selectedAnswers[q.id];
        const isCorr = userAns === q.correctIndex;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options || [],
          selectedAnswer: userAns ?? -1,
          correctAnswer: q.correctIndex,
          isCorrect: isCorr,
          explanation: q.explanation,
          topicTags: [q.topicTag || 'Core Concepts'],
          citationSnippet: q.citationSnippet,
        };
      });

      onCompleteAttempt?.({
        quizId,
        answers: selectedAnswers,
        perQuestionResults,
        durationSeconds: secondsElapsed,
      });
    }
  }, [currentIndex, totalQuestions, activeQuestions, selectedAnswers, onCompleteAttempt, quizId, secondsElapsed]);

  // Keyboard navigation: A-D or 1-4 to choose, Enter to continue
  useEffect(() => {
    if (isFinished || !currentQ) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const isAnswered = revealed[currentQ.id];

      if (!isAnswered) {
        if (key === 'a' || key === '1') handleSelectOption(0);
        else if (key === 'b' || key === '2') handleSelectOption(1);
        else if (key === 'c' || key === '3') handleSelectOption(2);
        else if (key === 'd' || key === '4') handleSelectOption(3);
      } else if (key === 'enter') {
        handleNextQuestion();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, currentQ, revealed, handleSelectOption, handleNextQuestion]);

  // Retry missed questions
  const handleRetryMissed = () => {
    const missed = activeQuestions.filter((q) => selectedAnswers[q.id] !== q.correctIndex);
    if (missed.length > 0) {
      setActiveQuestions(missed);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setRevealed({});
      setShowHint({});
      setIsFinished(false);
      setCurrentStreak(0);
    }
  };

  // Reset entire quiz
  const handleResetQuiz = () => {
    setActiveQuestions(quiz.questions || []);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setRevealed({});
    setShowHint({});
    setIsFinished(false);
    setCurrentStreak(0);
    setSecondsElapsed(0);
  };

  // -------------------------------------------------------------
  // Results Screen
  // -------------------------------------------------------------
  if (isFinished) {
    const finalAccuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const missedQuestions = activeQuestions.filter((q) => selectedAnswers[q.id] !== q.correctIndex);
    const weakTopics = Array.from(new Set(missedQuestions.map((q) => q.topicTag || 'Core Concepts')));

    return (
      <div className="w-full max-w-2xl mx-auto p-5 sm:p-7 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl text-[#f4f4f2] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-brand-500/15 border border-brand-500/30 text-brand-400 mb-1">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
          <h2 className="text-xl font-display font-bold text-[#f4f4f2]">Quiz Completed!</h2>
          <p className="text-xs text-[#9a9a94] font-serif">
            {finalAccuracy >= 80
              ? 'Outstanding mastery of your notebook materials!'
              : finalAccuracy >= 50
              ? 'Good effort! Review the missed concepts below to reinforce memory.'
              : 'Keep studying! Repetition strengthens synaptic retention.'}
          </p>
        </div>

        {/* Score Ring & Metrics */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#262626] border border-[#383838] text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{finalAccuracy}%</div>
            <div className="text-[11px] text-[#9a9a94] uppercase tracking-wider font-display font-medium">
              Accuracy ({correctCount}/{totalQuestions})
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-amber-400 flex items-center justify-center gap-1">
              <Flame className="w-5 h-5" />
              <span>{bestStreak}</span>
            </div>
            <div className="text-[11px] text-[#9a9a94] uppercase tracking-wider font-display font-medium">
              Best Streak
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-brand-300">
              {Math.floor(secondsElapsed / 60)}m {secondsElapsed % 60}s
            </div>
            <div className="text-[11px] text-[#9a9a94] uppercase tracking-wider font-display font-medium">
              Time Taken
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {missedQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleRetryMissed}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-semibold text-[#f4f4f2] bg-brand-600 hover:bg-brand-500 transition-colors shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Missed ({missedQuestions.length})</span>
            </button>
          )}

          {weakTopics.length > 0 && onNewQuizOnWeakTopics && (
            <button
              type="button"
              onClick={() => onNewQuizOnWeakTopics(weakTopics)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/40 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Quiz on Weak Topics</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetQuiz}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-semibold text-[#f4f4f2] bg-[#2a2a2a] hover:bg-[#343434] border border-[#3e3e3e] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake All</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-display font-semibold text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#252525] transition-colors cursor-pointer"
            >
              Back to Chat
            </button>
          )}
        </div>

        {/* Question Review Breakdown */}
        <div className="space-y-3 pt-3 border-t border-[#303030]">
          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-[#9a9a94]">
            Question Review ({totalQuestions})
          </h4>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1" data-lenis-prevent>
            {activeQuestions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorr = userAns === q.correctIndex;

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isCorr
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                      : 'bg-red-950/20 border-red-800/40 text-red-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[#f4f4f2]">
                      Q{idx + 1}. {q.question}
                    </span>
                    {isCorr ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                  </div>

                  <div className="text-[11px] space-y-1 font-sans">
                    <div className="text-[#a0a09c]">
                      Your answer:{' '}
                      <span className="font-semibold text-[#f4f4f2]">
                        {typeof userAns === 'number' && q.options[userAns]
                          ? q.options[userAns]
                          : String(userAns ?? 'Skipped')}
                      </span>
                    </div>
                    {!isCorr && (
                      <div className="text-emerald-300">
                        Correct answer:{' '}
                        <span className="font-semibold">
                          {typeof q.correctIndex === 'number' && q.options[q.correctIndex]
                            ? q.options[q.correctIndex]
                            : String(q.correctIndex)}
                        </span>
                      </div>
                    )}
                    <p className="mt-1 text-[#b5b5b0] italic">{q.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Live Playing Screen
  // -------------------------------------------------------------
  if (!currentQ) return null;

  const isAnswered = Boolean(revealed[currentQ.id]);
  const userChoice = selectedAnswers[currentQ.id];
  const isCorrect = isAnswered && userChoice === currentQ.correctIndex;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl text-[#f4f4f2] overflow-hidden my-3">
      {/* Top Progress & Metrics Bar */}
      <div className="p-4 sm:p-5 border-b border-[#2d2d2d] space-y-3 bg-[#242424]/60">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-brand-300">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#303030] text-[10px] text-[#9a9a94] font-medium">
              {currentQ.topicTag || 'Core Concepts'}
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-amber-400 font-semibold" title="Streak">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{currentStreak}</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <Trophy className="w-3.5 h-3.5" />
              <span>{correctCount} pts</span>
            </span>
            <span className="text-[#888884] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{Math.floor(secondsElapsed / 60)}:{String(secondsElapsed % 60).padStart(2, '0')}</span>
            </span>
          </div>
        </div>

        {/* Slim Animated Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-[#333333] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.25 }}
          />
        </div>
      </div>

      {/* Question Body */}
      <div className="p-5 sm:p-6 space-y-5">
        <h3 className="text-base sm:text-lg font-display font-semibold text-[#f4f4f2] leading-snug">
          {currentQ.question}
        </h3>

        {/* Options Grid */}
        <div className="space-y-2.5">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = userChoice === optIdx;
            const isThisCorrect = optIdx === currentQ.correctIndex;

            let cardStyle =
              'bg-[#262626] hover:bg-[#2d2d2d] border-[#383838] text-[#f4f4f2] cursor-pointer';

            if (isAnswered) {
              if (isThisCorrect) {
                cardStyle = 'bg-emerald-950/50 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-950/40';
              } else if (isSelected) {
                cardStyle = 'bg-red-950/50 border-red-500 text-red-100';
              } else {
                cardStyle = 'bg-[#222222] border-[#333333] text-[#70706b] opacity-60';
              }
            }

            return (
              <motion.button
                key={optIdx}
                type="button"
                whileTap={!isAnswered ? { scale: 0.99 } : {}}
                disabled={isAnswered}
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${cardStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 ${
                      isAnswered && isThisCorrect
                        ? 'bg-emerald-500 text-white'
                        : isAnswered && isSelected
                        ? 'bg-red-500 text-white'
                        : 'bg-[#333333] text-[#f4f4f2]'
                    }`}
                  >
                    {letters[optIdx] || optIdx + 1}
                  </span>
                  <span className="text-xs sm:text-sm font-sans font-medium leading-relaxed">
                    {option}
                  </span>
                </div>

                {isAnswered && (
                  <div className="shrink-0 ml-2">
                    {isThisCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isSelected ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : null}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Hint Section */}
        {currentQ.hint && !isAnswered && (
          <div className="pt-1">
            {showHint[currentQ.id] ? (
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-semibold">Hint:</strong> {currentQ.hint}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHint((prev) => ({ ...prev, [currentQ.id]: true }))}
                className="flex items-center gap-1.5 text-xs text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer font-medium"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Need a hint?</span>
              </button>
            )}
          </div>
        )}

        {/* Explanation & Grounding Citations Panel (Shown after answering) */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                isCorrect
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                  : 'bg-red-950/20 border-red-800/40 text-red-100'
              }`}
            >
              <div className="flex items-center gap-1.5 font-display font-bold">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Correct! Excellent recall.</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300">Incorrect. Let's learn why:</span>
                  </>
                )}
              </div>

              <p className="text-xs font-serif leading-relaxed text-[#f4f4f2]">
                {currentQ.explanation}
              </p>

              {/* Source Passage Snippet Citation */}
              {currentQ.citationSnippet && (
                <div className="p-2.5 rounded-lg bg-[#181818]/80 border border-[#303030] text-[11px] text-[#c0c0be] space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-brand-300">
                    <BookOpen className="w-3 h-3" />
                    <span>Grounding Source: {currentQ.sourceTitle || 'Notebook Document'}</span>
                  </div>
                  <blockquote className="italic border-l-2 border-brand-500/50 pl-2 text-[#9a9a94]">
                    "{currentQ.citationSnippet}"
                  </blockquote>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 sm:p-5 border-t border-[#2d2d2d] flex items-center justify-between bg-[#242424]/40">
        <span className="text-[11px] text-[#7a7a76] hidden sm:inline">
          Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-[#303030] text-[#f4f4f2]">A-D</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-[#303030] text-[#f4f4f2]">1-4</kbd> to choose, <kbd className="px-1.5 py-0.5 rounded bg-[#303030] text-[#f4f4f2]">Enter</kbd> to continue
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {!isAnswered ? (
            <button
              type="button"
              onClick={() => {
                // Skip question
                setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: -1 }));
                setRevealed((prev) => ({ ...prev, [currentQ.id]: true }));
                setCurrentStreak(0);
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-display font-medium text-[#9a9a94] hover:text-[#f4f4f2] transition-colors cursor-pointer"
            >
              Skip
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-display font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/30 cursor-pointer"
            >
              <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Results'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

