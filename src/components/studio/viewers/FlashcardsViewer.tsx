'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import {
  RotateCw,
  Shuffle,
  Check,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
  Award,
  X,
} from 'lucide-react';

export interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardsData {
  title: string;
  cards: FlashcardItem[];
}

export function FlashcardsViewer({
  content,
  onClose,
}: {
  content: string;
  onClose?: () => void;
}) {
  let parsedData: FlashcardsData;
  try {
    parsedData = JSON.parse(content);
  } catch {
    parsedData = {
      title: 'Study Flashcards',
      cards: [],
    };
  }

  const [cards, setCards] = useState<FlashcardItem[]>(parsedData.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());
  const [learningCardIds, setLearningCardIds] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsCompleted(true);
    }
  }, [currentIndex, cards.length]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsCompleted(false);
  };

  const markKnown = () => {
    if (!currentCard) return;
    setKnownCardIds((prev) => new Set(prev).add(currentCard.id));
    setLearningCardIds((prev) => {
      const copy = new Set(prev);
      copy.delete(currentCard.id);
      return copy;
    });
    handleNext();
  };

  const markLearning = () => {
    if (!currentCard) return;
    setLearningCardIds((prev) => new Set(prev).add(currentCard.id));
    setKnownCardIds((prev) => {
      const copy = new Set(prev);
      copy.delete(currentCard.id);
      return copy;
    });
    handleNext();
  };

  const handleRestartDeck = () => {
    setCards(parsedData.cards || []);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setKnownCardIds(new Set());
    setLearningCardIds(new Set());
    setIsCompleted(false);
  };

  const handlePracticeLearningOnly = () => {
    const learningOnly = cards.filter((c) => learningCardIds.has(c.id));
    if (learningOnly.length > 0) {
      setCards(learningOnly);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      setIsCompleted(false);
    }
  };

  // Keyboard Navigation: Space = flip, Left = Prev, Right = Next
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev]);

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
        <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <h2 className="font-display font-bold text-sm text-[#f4f4f2]">
              {parsedData.title || 'Study Flashcards'}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
              title="Close Flashcards"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center text-[#9a9a94]">
          <p className="font-display font-medium text-sm">No flashcards available in this deck.</p>
        </div>
      </div>
    );
  }

  // Completion Screen
  if (isCompleted) {
    const masteredCount = knownCardIds.size;
    const learningCount = learningCardIds.size;
    const totalCount = cards.length;

    return (
      <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
        <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-brand-400" />
            <h2 className="font-display font-bold text-sm text-[#f4f4f2]">
              Deck Review Completed
            </h2>
            <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Complete
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
              title="Close Flashcards"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/15 border border-brand-500/40 text-brand-400 flex items-center justify-center mb-6 shadow-xl">
            <Award className="w-10 h-10" />
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold text-[#f4f4f2] mb-1">
            Deck Review Complete!
          </h3>
          <p className="text-xs text-[#9a9a94] font-serif mb-8">
            {parsedData.title}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="p-5 rounded-2xl bg-[#262626] border border-[#303030] shadow-sm">
              <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Mastered</p>
              <p className="font-display text-3xl font-bold text-emerald-400 mt-1">
                {masteredCount} / {totalCount}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#262626] border border-[#303030] shadow-sm">
              <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Still Learning</p>
              <p className="font-display text-3xl font-bold text-amber-400 mt-1">
                {learningCount}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {learningCount > 0 && (
              <Button
                variant="primary"
                onClick={handlePracticeLearningOnly}
                className="w-full text-xs font-display font-semibold h-10"
              >
                Practice {learningCount} Learning Cards
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleRestartDeck}
              className="w-full text-xs font-display font-semibold h-10"
            >
              Restart Entire Deck
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full sm:w-auto text-xs font-display h-10 text-[#9a9a94] hover:text-[#f4f4f2]"
              >
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isCurrentKnown = knownCardIds.has(currentCard.id);
  const isCurrentLearning = learningCardIds.has(currentCard.id);

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      {/* Top Header Toolbar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <Layers className="w-4 h-4 text-brand-400 shrink-0" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {parsedData.title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 shrink-0">
            Active Recall Deck
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2] h-8 px-2.5"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5 mr-1.5" />
            Shuffle
          </Button>

          <span className="text-xs font-mono font-semibold text-[#f4f4f2] bg-[#262626] border border-[#303030] px-2.5 py-1 rounded-xl">
            {currentIndex + 1} / {cards.length}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
              title="Close Flashcards"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Flashcard Interactive Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-between max-w-2xl mx-auto w-full">
        {/* Progress & Stats Pills */}
        <div className="flex items-center justify-between gap-4 mb-4 text-xs font-display">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Mastered: {knownCardIds.size}
            </span>
            <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Learning: {learningCardIds.size}
            </span>
          </div>
          <span className="text-[10px] text-[#9a9a94] font-mono hidden sm:inline">
            Space to flip · ← / → to navigate
          </span>
        </div>

        {/* 3D Flip Card */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] perspective-1000 my-auto w-full">
          <div
            onClick={handleFlip}
            className={`w-full h-72 md:h-80 rounded-3xl p-8 cursor-pointer select-none transition-all duration-500 relative flex flex-col justify-between border shadow-2xl ${
              isFlipped
                ? 'bg-[#212121] border-brand-500/40 shadow-brand-500/10'
                : 'bg-[#262626] border-[#383838] hover:border-brand-500/40 hover:bg-[#2a2a2a]'
            }`}
          >
            {/* Card Header Label */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-display uppercase tracking-widest text-[#9a9a94] font-bold">
                {isFlipped ? 'Answer / Definition' : 'Term / Concept'}
              </span>
              <div className="flex items-center gap-2">
                {isCurrentKnown && (
                  <span className="text-[9px] font-display font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Mastered
                  </span>
                )}
                {isCurrentLearning && (
                  <span className="text-[9px] font-display font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Still Learning
                  </span>
                )}
                <span className="text-xs text-[#9a9a94] p-1.5 rounded-xl bg-[#191919] border border-[#303030]">
                  <RotateCw className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card Text */}
            <div className="my-auto text-center px-4">
              <p className={`font-display text-[#f4f4f2] transition-all ${
                isFlipped
                  ? 'text-base font-normal leading-relaxed font-serif text-[#e4e4e0]'
                  : 'text-xl md:text-2xl font-bold tracking-tight'
              }`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {currentCard.hint && !isFlipped && (
                <div className="mt-4">
                  {showHint ? (
                    <p className="text-xs text-amber-300 font-serif italic bg-amber-950/20 px-3 py-1.5 rounded-xl border border-amber-500/30 inline-block">
                      Hint: {currentCard.hint}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="text-[11px] font-display text-[#9a9a94] hover:text-amber-400 inline-flex items-center gap-1 underline underline-offset-2"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Show Hint
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Card Bottom Hint */}
            <div className="text-center">
              <span className="text-[10px] text-[#9a9a94] font-display">
                {isFlipped ? 'Click or Space to flip back' : 'Click or Space to reveal answer'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Still Learning vs Know It */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#303030] mt-6">
          <Button
            variant="secondary"
            onClick={markLearning}
            className="text-xs font-display font-semibold border-amber-500/30 hover:bg-amber-950/20 text-amber-300 h-10 shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            Still Learning
          </Button>
          <Button
            variant="primary"
            onClick={markKnown}
            className="text-xs font-display font-semibold bg-emerald-600 hover:bg-emerald-500 text-white h-10 shadow-sm"
          >
            <Check className="w-3.5 h-3.5 mr-1.5" />
            Know It!
          </Button>
        </div>

        {/* Prev / Next Footer */}
        <div className="flex items-center justify-between pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2]"
          >
            {currentIndex === cards.length - 1 ? 'Finish Deck' : 'Next'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
