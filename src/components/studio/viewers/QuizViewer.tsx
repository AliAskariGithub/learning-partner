'use client';

import React, { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { CheckCircle2, XCircle, RotateCcw, Award, ArrowRight, ArrowLeft } from 'lucide-react';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

export function QuizViewer({
  content,
  onClose,
}: {
  content: string;
  onClose?: () => void;
}) {
  let quizData: QuizData;
  try {
    quizData = JSON.parse(content);
  } catch {
    quizData = {
      title: 'Study Quiz',
      questions: [],
    };
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showScore, setShowScore] = useState(false);
  const [missedOnly, setMissedOnly] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>(quizData.questions);

  const currentQ = activeQuestions[currentIndex];
  const hasAnswered = selectedAnswers[currentIndex] !== undefined;
  const isCorrect = hasAnswered && selectedAnswers[currentIndex] === currentQ?.correctIndex;

  const handleSelectOption = (optionIndex: number) => {
    if (hasAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowScore(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    activeQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    return score;
  };

  const handleResetQuiz = () => {
    setActiveQuestions(quizData.questions);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setShowScore(false);
    setMissedOnly(false);
  };

  const handleRetryMissed = () => {
    const missed = activeQuestions.filter((q, idx) => selectedAnswers[idx] !== q.correctIndex);
    if (missed.length > 0) {
      setActiveQuestions(missed);
      setSelectedAnswers({});
      setCurrentIndex(0);
      setShowScore(false);
      setMissedOnly(true);
    }
  };

  if (!activeQuestions || activeQuestions.length === 0) {
    return (
      <div className="p-8 text-center text-[#9a9a94]">
        <p className="font-display font-medium text-sm">No quiz questions available.</p>
      </div>
    );
  }

  // Final Score Screen
  if (showScore) {
    const total = activeQuestions.length;
    const score = calculateScore();
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    return (
      <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
          passed ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' : 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
        }`}>
          <Award className="w-10 h-10" />
        </div>

        <h3 className="font-display text-2xl font-bold text-[#f4f4f2] mb-1">
          {passed ? 'Outstanding Knowledge Check!' : 'Keep Practicing!'}
        </h3>
        <p className="text-xs text-[#9a9a94] font-serif mb-6">
          {quizData.title}
        </p>

        <div className="grid grid-cols-2 gap-4 w-full mb-8">
          <div className="p-4 rounded-2xl bg-[#262626] border border-[#303030]">
            <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Score</p>
            <p className="font-display text-2xl font-bold text-[#f4f4f2] mt-1">
              {score} / {total}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#262626] border border-[#303030]">
            <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Accuracy</p>
            <p className="font-display text-2xl font-bold text-brand-400 mt-1">
              {percentage}%
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {score < total && (
            <Button
              variant="primary"
              onClick={handleRetryMissed}
              className="w-full text-xs font-display font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Retry {total - score} Missed Questions
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleResetQuiz}
            className="w-full text-xs font-display font-semibold"
          >
            Restart Entire Quiz
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col h-full max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#303030] mb-6">
        <div>
          <span className="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            {missedOnly ? 'Missed Questions Review' : 'Knowledge Check'}
          </span>
          <h2 className="font-display font-bold text-base text-[#f4f4f2] mt-1.5">
            {quizData.title}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono font-semibold text-[#f4f4f2]">
            {currentIndex + 1} of {activeQuestions.length}
          </span>
          <div className="w-24 h-1.5 bg-[#262626] rounded-full overflow-hidden mt-1.5 border border-[#303030]">
            <div
              className="h-full bg-brand-500 transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <p className="font-display font-semibold text-lg text-[#f4f4f2] mb-6 leading-relaxed">
            {currentQ.question}
          </p>

          <div className="space-y-3">
            {currentQ.options.map((option, oIdx) => {
              const isSelected = selectedAnswers[currentIndex] === oIdx;
              const isCorrectOption = oIdx === currentQ.correctIndex;

              let style = 'bg-[#262626] border-[#303030] hover:border-brand-500/50 text-[#f4f4f2]';
              let badgeColor = 'bg-[#191919] border-[#303030] text-[#9a9a94]';

              if (hasAnswered) {
                if (isCorrectOption) {
                  style = 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200';
                  badgeColor = 'bg-emerald-500 text-black font-bold';
                } else if (isSelected) {
                  style = 'bg-rose-950/30 border-rose-500/60 text-rose-200';
                  badgeColor = 'bg-rose-500 text-white font-bold';
                } else {
                  style = 'opacity-40 bg-[#262626] border-[#303030] text-[#9a9a94]';
                }
              }

              const letters = ['A', 'B', 'C', 'D', 'E'];

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${style}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono shrink-0 border ${badgeColor}`}>
                    {letters[oIdx] || oIdx + 1}
                  </span>
                  <span className="text-sm font-sans flex-1 mt-0.5 leading-snug">
                    {option}
                  </span>
                  {hasAnswered && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {hasAnswered && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {hasAnswered && (
            <div className={`mt-5 p-4 rounded-2xl border ${
              isCorrect ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-display font-bold text-xs uppercase tracking-wider">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-xs font-serif leading-relaxed text-[#d4d4d0]">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#303030]">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-xs font-display"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          {hasAnswered && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="text-xs font-display font-semibold"
            >
              {currentIndex === activeQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

