'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  FileText,
  FileCode,
  Printer,
} from 'lucide-react';
import { exportToPdf, exportToMarkdown, printFormattedDocument } from '@/lib/export/export-helper';

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
  const { toast } = useToast();
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

  const handlePrevious = () => {
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

  const formatWorksheet = () => {
    let md = `# ${quizData.title || 'Study Quiz Worksheet'}\n\n`;
    md += `**Total Questions:** ${quizData.questions.length}\n\n---\n\n`;
    md += `## Questions\n\n`;
    quizData.questions.forEach((q, idx) => {
      md += `### Question ${idx + 1}: ${q.question}\n`;
      q.options.forEach((opt, oIdx) => {
        const letter = String.fromCharCode(65 + oIdx);
        md += `- **(${letter})** ${opt}\n`;
      });
      md += `\n`;
    });
    md += `---\n\n## Answer Key & Explanations\n\n`;
    quizData.questions.forEach((q, idx) => {
      const letter = String.fromCharCode(65 + q.correctIndex);
      md += `**${idx + 1}. Correct Answer: (${letter})** ${q.options[q.correctIndex] || ''}\n`;
      if (q.explanation) {
        md += `*Explanation:* ${q.explanation}\n\n`;
      } else {
        md += `\n`;
      }
    });
    return md;
  };

  const handleDownloadPdf = () => {
    try {
      const md = formatWorksheet();
      exportToPdf({
        filename: `${(quizData.title || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-worksheet.pdf`,
        title: quizData.title || 'Study Quiz Worksheet',
        content: md,
        metadata: { type: 'QUIZ WORKSHEET' },
      });
      toast({ title: 'Downloaded PDF', description: 'Quiz Worksheet PDF saved to your device.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not download PDF.', variant: 'error' });
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const md = formatWorksheet();
      exportToMarkdown(`${(quizData.title || 'quiz').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-worksheet.md`, md);
      toast({ title: 'Downloaded Markdown', description: 'Quiz Markdown saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not save Markdown.', variant: 'error' });
    }
  };

  const handlePrint = () => {
    try {
      const md = formatWorksheet();
      printFormattedDocument(quizData.title || 'Study Quiz Worksheet', md, { type: 'Quiz Worksheet' });
    } catch (err: any) {
      toast({ title: 'Print Failed', description: err.message || 'Could not open print preview.', variant: 'error' });
    }
  };

  if (!activeQuestions || activeQuestions.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
        <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h2 className="font-display font-bold text-sm text-[#f4f4f2]">
              {quizData.title || 'Study Quiz'}
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
              title="Close Quiz"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-8 text-center text-[#9a9a94]">
          <p className="font-display font-medium text-sm">No quiz questions available.</p>
        </div>
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
      <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h2 className="font-display font-bold text-sm text-[#f4f4f2]">
              Quiz Results
            </h2>
            <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs h-8 px-2.5 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1.5 font-display font-medium"
              title="Download Worksheet as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="text-xs h-8 px-2.5 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1.5 font-display font-medium"
              title="Download Worksheet as Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>.md</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Print Quiz Worksheet"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer"
                title="Close Quiz"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto w-full">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${
            passed ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400' : 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
          }`}>
            <Award className="w-10 h-10" />
          </div>

          <h3 className="font-display text-2xl md:text-3xl font-bold text-[#f4f4f2] mb-1">
            {passed ? 'Outstanding Knowledge Check!' : 'Good Effort! Keep Practicing'}
          </h3>
          <p className="text-xs text-[#9a9a94] font-serif mb-8">
            {quizData.title}
          </p>

          <div className="grid grid-cols-2 gap-4 w-full mb-8">
            <div className="p-5 rounded-2xl bg-[#262626] border border-[#303030] shadow-sm">
              <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Score</p>
              <p className="font-display text-3xl font-bold text-[#f4f4f2] mt-1">
                {score} / {total}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#262626] border border-[#303030] shadow-sm">
              <p className="text-[11px] font-display uppercase tracking-wider text-[#9a9a94]">Accuracy</p>
              <p className="font-display text-3xl font-bold text-brand-400 mt-1">
                {percentage}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {score < total && (
              <Button
                variant="primary"
                onClick={handleRetryMissed}
                className="w-full text-xs font-display font-semibold h-10"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Retry {total - score} Missed Questions
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleResetQuiz}
              className="w-full text-xs font-display font-semibold h-10"
            >
              Restart Entire Quiz
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

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {quizData.title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 shrink-0">
            {missedOnly ? 'Missed Questions Review' : 'Knowledge Check'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#f4f4f2]">
              {currentIndex + 1} of {activeQuestions.length}
            </span>
            <div className="w-16 sm:w-24 h-1.5 bg-[#262626] rounded-full overflow-hidden border border-[#303030]">
              <div
                className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-[#303030] pl-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPdf}
              className="text-xs h-8 px-2 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1 font-display font-medium"
              title="Download Printable Quiz as PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadMarkdown}
              className="text-xs h-8 px-2 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1 font-display font-medium"
              title="Download Quiz as Markdown"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">.md</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrint}
              className="text-xs h-8 px-2 text-[#9a9a94] hover:text-[#f4f4f2]"
              title="Print Quiz Worksheet"
            >
              <Printer className="w-3.5 h-3.5" />
            </Button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer ml-1"
              title="Close Quiz"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Question Area (Spacious & Clean) */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col justify-between max-w-3xl mx-auto w-full">
        <div>
          <p className="font-display font-semibold text-lg sm:text-xl text-[#f4f4f2] mb-6 leading-relaxed break-words">
            {currentQ.question}
          </p>

          <div className="space-y-3">
            {currentQ.options.map((option, oIdx) => {
              const isSelected = selectedAnswers[currentIndex] === oIdx;
              const isCorrectOption = oIdx === currentQ.correctIndex;

              let optionStyle = 'bg-[#1f1f1f] border-[#303030] text-[#f4f4f2] hover:bg-[#262626]';
              if (hasAnswered) {
                if (isCorrectOption) {
                  optionStyle = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-200';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = 'bg-rose-500/15 border-rose-500/60 text-rose-200';
                } else {
                  optionStyle = 'bg-[#191919] border-[#2a2a2a] text-[#71717a] opacity-50';
                }
              }

              const letter = String.fromCharCode(65 + oIdx);

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(oIdx)}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${optionStyle}`}
                >
                  <span className="w-6 h-6 rounded-lg bg-[#2b2b2b] border border-[#3a3a3a] flex items-center justify-center text-xs font-display font-bold shrink-0 mt-0.5">
                    {letter}
                  </span>
                  <span className="font-serif text-sm leading-relaxed flex-1">
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

          {/* Explanation Banner */}
          {hasAnswered && (
            <div className={`mt-6 p-4 rounded-2xl border ${
              isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className={`font-display font-bold text-xs ${isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-xs text-[#dcdcd8] font-serif leading-relaxed mt-1">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-[#303030] mt-8">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentIndex === 0}
            onClick={handlePrevious}
            className="text-xs font-display font-semibold text-[#9a9a94] hover:text-[#f4f4f2]"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Previous
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={!hasAnswered}
            onClick={handleNext}
            className="text-xs font-display font-semibold px-4"
          >
            {currentIndex === activeQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
