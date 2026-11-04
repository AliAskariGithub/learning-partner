'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import {
  Sparkles,
  HelpCircle,
  Headphones,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Volume2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Lock,
  Zap,
} from 'lucide-react';

export function InteractiveHeroPreview() {
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'audio'>('chat');
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  
  // Quiz state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);

  // Audio player state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-12 -left-12 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Floating Micro-Badge: Top Left (Desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="hidden md:flex items-center gap-1.5 absolute -top-5 -left-4 z-20 px-3 py-1.5 rounded-full bg-surface border border-border shadow-lg shadow-black/20 text-[11px] font-display font-medium text-foreground backdrop-blur-md"
      >
        <Lock className="w-3.5 h-3.5 text-emerald-400" />
        <span>AES-256-GCM Encrypted Keys</span>
      </motion.div>

      {/* Floating Micro-Badge: Top Right (Desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="hidden md:flex items-center gap-1.5 absolute -top-5 -right-4 z-20 px-3 py-1.5 rounded-full bg-surface border border-brand-500/30 shadow-lg shadow-brand-500/10 text-[11px] font-display font-medium text-brand-400 backdrop-blur-md"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
        <span>100% Verifiable Citations</span>
      </motion.div>

      {/* Main Interactive Card */}
      <Card className="p-4 sm:p-6 md:p-7 bg-surface-raised/60 backdrop-blur-md border-border text-left shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-brand-500/30">
        {/* Card Header with Mac-style controls & Mode Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-error/70" />
              <div className="w-3 h-3 rounded-full bg-warning/70" />
              <div className="w-3 h-3 rounded-full bg-success/70" />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-muted-foreground truncate">
              <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="truncate">Raft_Consensus_Spec.pdf</span>
              <span className="text-emerald-400 text-[10px] bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 rounded-full hidden sm:inline">
                Indexed
              </span>
            </div>
          </div>

          {/* Interactive Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs font-display self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px] sm:text-xs ${
                activeTab === 'chat'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px] sm:text-xs ${
                activeTab === 'quiz'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              <span>Recall Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px] sm:text-xs ${
                activeTab === 'audio'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Headphones className="w-3 h-3" />
              <span>Studio Audio</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Grounded Chat Content */}
        {activeTab === 'chat' && (
          <div className="mt-4 sm:mt-6 space-y-3.5">
            {/* User Question */}
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-surface border border-border flex items-center justify-center font-display text-[11px] sm:text-xs font-bold shrink-0 mt-0.5">
                Q
              </div>
              <div className="text-xs sm:text-sm font-serif text-foreground/90 bg-surface p-3 sm:p-3.5 rounded-xl border border-border leading-relaxed">
                How does Raft prevent split votes from stalling the cluster indefinitely during election?
              </div>
            </div>

            {/* AI Answer with Clickable Citations */}
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-brand-600/30 font-bold text-[11px] sm:text-xs mt-0.5">
                AI
              </div>
              <div className="text-xs sm:text-sm font-serif text-foreground bg-surface-raised p-3.5 sm:p-4 rounded-xl border border-brand-500/20 leading-relaxed w-full">
                <p>
                  To prevent split votes from repeating indefinitely, Raft uses{' '}
                  <strong className="text-brand-300 font-semibold">randomized election timeouts</strong>{' '}
                  chosen randomly from a fixed interval (typically 150–300ms){' '}
                  <button
                    type="button"
                    onClick={() => setSelectedCitation(selectedCitation === 1 ? null : 1)}
                    className="citation-chip cursor-pointer inline-flex items-center gap-1 mx-1 hover:border-brand-400 hover:text-brand-300 transition-all"
                    title="Click to view verified source text"
                  >
                    <span>[1]</span>
                    <span className="font-mono text-[10px]">§5.2 p.6</span>
                  </button>
                  . This spreads out the timeouts so that in most cases only a single server will time out,
                  win the election, and establish heartbeats before other nodes timeout{' '}
                  <button
                    type="button"
                    onClick={() => setSelectedCitation(selectedCitation === 2 ? null : 2)}
                    className="citation-chip cursor-pointer inline-flex items-center gap-1 mx-1 hover:border-brand-400 hover:text-brand-300 transition-all"
                    title="Click to view verified source text"
                  >
                    <span>[2]</span>
                    <span className="font-mono text-[10px]">Fig. 4</span>
                  </button>
                  .
                </p>

                {/* Interactive Source Inspector Drawer */}
                <AnimatePresence>
                  {selectedCitation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-3.5 pt-3 border-t border-border overflow-hidden"
                    >
                      <div className="p-3 rounded-lg bg-surface border border-brand-500/40 text-[11px] font-mono">
                        <div className="flex items-center justify-between text-brand-400 font-semibold pb-1.5 mb-1.5 border-b border-border/60">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            Source Excerpt [{selectedCitation}]
                          </span>
                          <span className="text-[10px] text-emerald-400 font-normal">
                            Verbatim Grounding
                          </span>
                        </div>
                        <p className="text-muted-foreground font-serif text-xs leading-relaxed italic">
                          {selectedCitation === 1
                            ? '"Raft uses randomized election timeouts to ensure that split votes are rare and that they are resolved quickly. Election timeouts are chosen randomly from a fixed interval (e.g., 150–300ms)."'
                            : '"Figure 4: A timeline of election timeouts. Randomization breaks the symmetry between candidates so that one node times out and collects quorums before rivals."'
                          }
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-2 text-[11px] text-muted-foreground font-sans flex items-center gap-1">
                  <span className="text-brand-400">💡 Tip:</span> Click on <span className="font-mono text-brand-300 font-semibold">[1]</span> or <span className="font-mono text-brand-300 font-semibold">[2]</span> to inspect verified source evidence.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Active Recall Quiz Content */}
        {activeTab === 'quiz' && (
          <div className="mt-4 sm:mt-6 p-4 rounded-xl bg-surface border border-border">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-brand-400">
                Active Recall Check · Question 1 of 3
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Difficulty: Conceptual
              </span>
            </div>

            <h4 className="text-xs sm:text-sm font-display font-semibold text-foreground mb-3">
              Why does Raft randomize election timeouts instead of assigning static node priorities?
            </h4>

            <div className="space-y-2">
              {[
                {
                  id: 0,
                  text: 'To avoid hardcoded hierarchies and ensure symmetry breaking in any network partition.',
                  correct: true,
                  feedback: 'Correct! Randomized timeouts prevent repeated split-vote ties in symmetric topologies without centralized coordinators.',
                },
                {
                  id: 1,
                  text: 'To reduce the total number of RPC packets sent across switches by 50%.',
                  correct: false,
                  feedback: 'Incorrect. Timeout randomization is designed for symmetry breaking during leader elections, not packet throttling.',
                },
                {
                  id: 2,
                  text: 'Because Raft assumes clock drift is completely non-existent.',
                  correct: false,
                  feedback: 'Incorrect. Raft relies on timing requirements (broadcastTime << electionTimeout << MTBF) rather than synchronized physical clocks.',
                },
              ].map((option) => {
                const isSelected = selectedQuizAnswer === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedQuizAnswer(option.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs font-serif transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? option.correct
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-foreground'
                          : 'border-error/60 bg-error/10 text-foreground'
                        : 'border-border bg-surface-raised hover:border-brand-500/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{option.text}</p>
                      {isSelected && (
                        <p className={`mt-1.5 text-[11px] font-mono ${option.correct ? 'text-emerald-400' : 'text-error'}`}>
                          {option.feedback}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      option.correct ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                      )
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Studio Voice Overview Content */}
        {activeTab === 'audio' && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-xl bg-surface border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-700/60 flex items-center justify-center text-purple-300 font-display font-bold">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-sm text-foreground">
                    Deep Dive: Consensus &amp; Raft Invariants
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Alex (Curious Host) &amp; Jordan (Systems Architect) · 4:18
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Overview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Listen Preview</span>
                  </>
                )}
              </Button>
            </div>

            {/* Audio Waveform Equalizer Mockup */}
            <div className="flex items-center gap-1.5 h-10 px-3 rounded-lg bg-surface-raised border border-border/60">
              <span className="text-[10px] font-mono text-muted-foreground mr-2 shrink-0">
                {isPlayingAudio ? '0:24' : '0:00'}
              </span>
              <div className="flex items-center gap-1 flex-1 h-full">
                {[12, 24, 18, 30, 15, 28, 22, 34, 16, 26, 32, 18, 12, 28, 20, 36, 14, 25, 30, 18, 22, 14, 28, 20].map((h, i) => (
                  <motion.div
                    key={i}
                    className={`flex-1 rounded-full ${isPlayingAudio ? 'bg-brand-500' : 'bg-muted-foreground/30'}`}
                    animate={{
                      height: isPlayingAudio ? [h * 0.4, h, h * 0.6] : h * 0.3,
                    }}
                    transition={{
                      repeat: isPlayingAudio ? Infinity : 0,
                      duration: 0.6 + (i % 3) * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground ml-2 shrink-0">
                4:18
              </span>
            </div>

            {/* Live Host Dialogue Snippet */}
            <div className="mt-3 p-3 rounded-lg bg-surface-raised border border-border/40 text-xs font-serif text-muted-foreground leading-relaxed">
              <span className="text-brand-400 font-display font-semibold">Jordan:</span> &quot;So whenever two candidates get three votes each in a six-node cluster, neither wins. The randomized timer solves that by making one wake up first!&quot;
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
