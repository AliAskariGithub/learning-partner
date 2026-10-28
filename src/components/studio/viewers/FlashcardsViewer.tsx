'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from '@/components/ui';
import {
  RotateCw,
  Shuffle,
  Check,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Layers,
  Sparkles,
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

  const currentCard = cards[currentIndex];

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
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
      <div className="p-8 text-center text-[#9a9a94]">
        <p className="font-display font-medium text-sm">No flashcards available.</p>
      </div>
    );
  }

  const isCurrentKnown = knownCardIds.has(currentCard.id);
  const isCurrentLearning = learningCardIds.has(currentCard.id);

  return (
    <div className="p-6 md:p-8 flex flex-col h-full max-w-xl mx-auto">
      {/* Top Status & Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-[#303030] mb-6">
        <div>
          <span className="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Active Recall
          </span>
          <h2 className="font-display font-bold text-base text-[#f4f4f2] mt-1.5">
            {parsedData.title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2] h-8 px-2.5"
            title="Shuffle deck"
          >
            <Shuffle className="w-3.5 h-3.5 mr-1.5" />
            Shuffle
          </Button>
          <span className="text-xs font-mono font-semibold text-[#f4f4f2] ml-2">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
      </div>

      {/* Progress & Stats Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 text-xs font-display">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Mastered: {knownCardIds.size}
          </span>
          <span className="inline-flex items-center gap-1.5 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Learning: {learningCardIds.size}
          </span>
        </div>
        <span className="text-[10px] text-[#9a9a94] hidden sm:inline">
          Tip: Space to flip · Left/Right arrows to navigate
        </span>
      </div>

      {/* 3D Flip Card Container */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] perspective-1000 my-auto">
        <div
          onClick={handleFlip}
          className={`w-full h-72 md:h-80 rounded-3xl p-8 cursor-pointer select-none transition-all duration-500 relative flex flex-col justify-between border shadow-2xl ${
            isFlipped
              ? 'bg-[#212121] border-brand-500/40'
              : 'bg-[#262626] border-[#383838] hover:border-brand-500/30'
          }`}
        >
          {/* Card Top Label */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-display uppercase tracking-widest text-[#9a9a94] font-semibold">
              {isFlipped ? 'Definition / Answer' : 'Term / Concept'}
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

          {/* Card Core Text */}
          <div className="my-auto text-center px-4">
            <p className={`font-display text-[#f4f4f2] transition-all ${
              isFlipped ? 'text-base font-normal leading-relaxed font-serif text-[#e4e4e0]' : 'text-xl md:text-2xl font-bold tracking-tight'
            }`}>
              {isFlipped ? currentCard.back : currentCard.front}
            </p>

            {/* Optional Hint */}
            {!isFlipped && currentCard.hint && (
              <div className="mt-4">
                {showHint ? (
                  <p className="text-xs text-amber-300/90 font-serif italic bg-amber-950/20 py-1.5 px-3 rounded-xl border border-amber-500/20 inline-block">
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

          {/* Card Bottom Prompt */}
          <div className="text-center">
            <span className="text-[10px] text-[#9a9a94] font-display">
              {isFlipped ? 'Click card to flip back' : 'Click card to reveal answer'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: "Still Learning" vs "Know It" */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#303030] mt-6">
        <Button
          variant="secondary"
          onClick={markLearning}
          className="text-xs font-display font-semibold border-amber-500/30 hover:bg-amber-950/20 text-amber-300 h-10"
        >
          <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
          Still Learning
        </Button>
        <Button
          variant="primary"
          onClick={markKnown}
          className="text-xs font-display font-semibold bg-emerald-600 hover:bg-emerald-500 text-white h-10"
        >
          <Check className="w-3.5 h-3.5 mr-1.5" />
          Know It!
        </Button>
      </div>

      {/* Prev / Next Bottom Stepper */}
      <div className="flex items-center justify-between pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="text-xs"
        >
          Next
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}

