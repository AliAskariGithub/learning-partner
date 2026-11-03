'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
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
  FileText,
  FileCode,
  Printer,
} from 'lucide-react';
import { exportToPdf, exportToMarkdown, printFormattedDocument } from '@/lib/export/export-helper';

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
  const { toast } = useToast();
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

  const handleMarkKnown = () => {
    if (!currentCard) return;
    setKnownCardIds((prev) => new Set(prev).add(currentCard.id));
    setLearningCardIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleMarkLearning = () => {
    if (!currentCard) return;
    setLearningCardIds((prev) => new Set(prev).add(currentCard.id));
    setKnownCardIds((prev) => {
      const next = new Set(prev);
      next.delete(currentCard.id);
      return next;
    });
    handleNext();
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setIsCompleted(false);
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

  const formatFlashcardsDocument = () => {
    let md = `# ${parsedData.title || 'Study Flashcards'}\n\n`;
    md += `**Total Flashcards:** ${cards.length}\n\n---\n\n`;
    cards.forEach((c, idx) => {
      md += `### Card ${idx + 1}: ${c.front}\n\n`;
      md += `**Answer / Definition:**\n${c.back}\n\n`;
      if (c.hint) md += `*Hint:* ${c.hint}\n\n`;
      md += `---\n\n`;
    });
    return md;
  };

  const handleDownloadPdf = () => {
    try {
      const md = formatFlashcardsDocument();
      exportToPdf({
        filename: `${(parsedData.title || 'flashcards').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-sheet.pdf`,
        title: parsedData.title || 'Study Flashcards',
        content: md,
        metadata: { type: 'FLASHCARDS STUDY SHEET' },
      });
      toast({ title: 'Downloaded PDF', description: 'Flashcards PDF saved to your device.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not download PDF.', variant: 'error' });
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const md = formatFlashcardsDocument();
      exportToMarkdown(`${(parsedData.title || 'flashcards').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cards.md`, md);
      toast({ title: 'Downloaded Markdown', description: 'Flashcards Markdown saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not save Markdown.', variant: 'error' });
    }
  };

  const handlePrint = () => {
    try {
      const md = formatFlashcardsDocument();
      printFormattedDocument(parsedData.title || 'Study Flashcards', md, { type: 'Flashcards Study Sheet' });
    } catch (err: any) {
      toast({ title: 'Print Failed', description: err.message || 'Could not open print preview.', variant: 'error' });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs h-8 px-2.5 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1.5 font-display font-medium"
              title="Download Study Sheet as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="text-xs h-8 px-2.5 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1.5 font-display font-medium"
              title="Download Cards as Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>.md</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Print Flashcards Study Sheet"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
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

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
          <div className="w-20 h-20 rounded-3xl bg-brand-500/15 border border-brand-500/40 text-brand-400 flex items-center justify-center mb-6 shadow-xl">
            <Award className="w-10 h-10" />
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold text-[#f4f4f2] mb-1">
            Flashcards Session Complete!
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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2] h-8 px-2"
            title="Shuffle Deck"
          >
            <Shuffle className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Shuffle</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs h-8 px-2 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1 font-display font-medium"
            title="Download Study Sheet as PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs h-8 px-2 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1 font-display font-medium"
            title="Download Cards as Markdown"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.md</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Print Flashcards Study Sheet"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>

          <span className="text-xs font-mono font-semibold text-[#f4f4f2] bg-[#262626] border border-[#303030] px-2 py-1 rounded-xl ml-1">
            {currentIndex + 1} / {cards.length}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer ml-1"
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
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {knownCardIds.size} Mastered
            </span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {learningCardIds.size} Learning
            </span>
          </div>

          <span className="text-[#9a9a94] text-[11px] font-serif hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#262626] border border-[#383838] text-[10px]">Space</kbd> to flip
          </span>
        </div>

        {/* 3D Flip Card */}
        <div
          onClick={handleFlip}
          className="relative w-full aspect-[16/10] min-h-[260px] cursor-pointer select-none group perspective-1000"
        >
          <div
            className={`w-full h-full rounded-3xl transition-transform duration-500 transform-style-3d border shadow-2xl p-6 sm:p-10 flex flex-col justify-between ${
              isFlipped
                ? 'bg-gradient-to-br from-[#222222] to-[#1c1c1c] border-brand-500/50 text-[#f4f4f2]'
                : 'bg-gradient-to-br from-[#1f1f1f] to-[#171717] border-[#383838] hover:border-brand-500/40 text-[#f4f4f2]'
            }`}
          >
            {/* Top Card Badge */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-display font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#262626] border border-[#303030] text-[#9a9a94]">
                {isFlipped ? 'Definition / Answer' : 'Question / Concept'}
              </span>

              <div className="flex items-center gap-1.5">
                {isCurrentKnown && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Mastered
                  </span>
                )}
                {isCurrentLearning && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Learning
                  </span>
                )}
                <RotateCw className="w-3.5 h-3.5 text-[#9a9a94] group-hover:rotate-180 transition-transform duration-300" />
              </div>
            </div>

            {/* Main Text */}
            <div className="my-auto text-center py-4">
              <p className={`font-serif leading-relaxed ${isFlipped ? 'text-base sm:text-xl text-[#dcdcd8]' : 'text-xl sm:text-2xl font-bold font-display text-[#f4f4f2]'}`}>
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {/* Optional Hint on Front */}
              {!isFlipped && currentCard.hint && (
                <div className="mt-4">
                  {showHint ? (
                    <p className="text-xs text-amber-300/90 font-serif italic bg-amber-500/10 border border-amber-500/30 rounded-xl py-1 px-3 inline-block">
                      Hint: {currentCard.hint}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="text-xs text-[#9a9a94] hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Show Hint
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Card Footer */}
            <div className="text-center">
              <span className="text-[11px] text-[#71717a] font-serif">
                Click anywhere to flip
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Mark Learning vs Mastered */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-[#303030]">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkLearning}
              className="text-xs font-display font-medium text-amber-300 border-amber-500/30 hover:bg-amber-950/20"
            >
              Still Learning
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkKnown}
              className="text-xs font-display font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              I Know This
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="text-xs text-[#9a9a94] hover:text-[#f4f4f2]"
          >
            Next
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
