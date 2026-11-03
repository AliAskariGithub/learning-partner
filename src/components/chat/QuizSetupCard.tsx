'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Play,
  Settings2,
  Clock,
  BookOpen,
  Check,
} from 'lucide-react';
import { Source } from '@/db/schema';

export interface QuizSetupConfig {
  topic: string;
  questionCount: 5 | 10 | 15 | 20;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionType: 'multiple_choice' | 'true_false' | 'mixed';
  useTimer: boolean;
  selectedSourceIds: string[];
}

export interface QuizSetupCardProps {
  initialTopic?: string;
  sources: Source[];
  onStartQuiz: (config: QuizSetupConfig) => void;
  onCancel?: () => void;
}

export function QuizSetupCard({
  initialTopic = '',
  sources,
  onStartQuiz,
  onCancel,
}: QuizSetupCardProps) {
  const [topic, setTopic] = useState(initialTopic);
  const [questionCount, setQuestionCount] = useState<5 | 10 | 15 | 20>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'mixed'>('multiple_choice');
  const [useTimer, setUseTimer] = useState(false);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    sources.filter((s) => s.enabled).map((s) => s.id)
  );

  const handleToggleSource = (id: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz({
      topic: topic.trim() || 'General Notebook Review',
      questionCount,
      difficulty,
      questionType,
      useTimer,
      selectedSourceIds,
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto p-5 sm:p-6 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl text-[#f4f4f2] space-y-5 my-3 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center gap-2.5 pb-3 border-b border-[#2d2d2d]">
        <div className="w-8 h-8 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-bold text-sm text-[#f4f4f2]">Configure Interactive Quiz</h3>
          <p className="text-[11px] text-[#9a9a94] font-serif">
            Grounded recall assessment generated directly from your sources
          </p>
        </div>
      </div>

      <form onSubmit={handleStart} className="space-y-4">
        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
            Quiz Topic / Focus
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Raft Consensus Algorithm, Chapter 3 Key Principles"
            className="w-full px-3.5 py-2 rounded-xl bg-[#262626] border border-[#383838] text-xs text-[#f4f4f2] placeholder-[#70706b] focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Number of Questions & Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Question Count */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
              Questions
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {([5, 10, 15, 20] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-1.5 rounded-lg text-xs font-display font-semibold transition-all cursor-pointer ${
                    questionCount === cnt
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-[#262626] text-[#9a9a94] hover:text-[#f4f4f2] border border-[#333333]'
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
              Difficulty
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['easy', 'medium', 'hard', 'mixed'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-1.5 capitalize rounded-lg text-[11px] font-display font-semibold transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                      : 'bg-[#262626] text-[#9a9a94] hover:text-[#f4f4f2] border border-[#333333]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timer Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#262626] border border-[#333333]">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-[#f4f4f2]">Timed Assessment</span>
          </div>
          <button
            type="button"
            onClick={() => setUseTimer(!useTimer)}
            className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
              useTimer ? 'bg-brand-600' : 'bg-[#3a3a3a]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                useTimer ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-display font-semibold text-[#9a9a94] hover:text-[#f4f4f2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-display font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-600/30 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate & Start Quiz</span>
          </button>
        </div>
      </form>
    </div>
  );
}
