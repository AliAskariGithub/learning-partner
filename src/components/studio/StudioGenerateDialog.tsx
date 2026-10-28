'use client';

import React, { useState } from 'react';
import { Button, Input, Textarea, Dialog, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { Source } from '@/db/schema';
import { SafeApiKey } from '@/app/app/api-key-actions';
import {
  HelpCircle,
  Layers,
  BookOpen,
  AlignLeft,
  GitFork,
  ScrollText,
  Mic,
  Play,
  Volume2,
  AlertTriangle,
  Sparkles,
  FileText,
  Check,
} from 'lucide-react';
import { TTS_VOICE_CATALOG, getVoicesForProvider, ProviderId } from '@/lib/ai/providers';

export interface StudioGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice';
  sources: Source[];
  userKeys: SafeApiKey[];
  selectedModelId: string;
  onGenerate: (params: {
    type: 'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice';
    sourceIds: string[];
    options: any;
  }) => Promise<void>;
  isGenerating?: boolean;
}

export function StudioGenerateDialog({
  isOpen,
  onClose,
  type,
  sources,
  userKeys,
  selectedModelId,
  onGenerate,
  isGenerating = false,
}: StudioGenerateDialogProps) {
  const { toast } = useToast();

  // Source selection state (default to all enabled sources)
  const readySources = sources.filter((s) => s.status === 'ready');
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>(
    readySources.filter((s) => s.enabled).map((s) => s.id)
  );

  // General options
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [itemCount, setItemCount] = useState<number>(type === 'quiz' ? 5 : 8);
  const [language, setLanguage] = useState('English');
  const [focusTopic, setFocusTopic] = useState('');
  const [extraInstructions, setExtraInstructions] = useState('');

  // Report option
  const [reportFormat, setReportFormat] = useState<'briefing' | 'essay' | 'blog_post' | 'custom'>('briefing');

  // Voice options
  const [voiceStyle, setVoiceStyle] = useState<'conversation' | 'narration'>('conversation');
  const [voiceFormat, setVoiceFormat] = useState<'deep_dive' | 'brief' | 'critique' | 'debate'>('deep_dive');
  
  // Available TTS providers: user keys that support TTS, plus 'web_speech' free fallback
  const hasGeminiKey = userKeys.some((k) => k.provider === 'google' && k.status === 'active');
  const hasOpenAiKey = userKeys.some((k) => k.provider === 'openai' && k.status === 'active');

  const [voiceProvider, setVoiceProvider] = useState<ProviderId | 'web_speech'>(
    hasGeminiKey ? 'google' : hasOpenAiKey ? 'openai' : 'web_speech'
  );

  const availableVoices = getVoicesForProvider(voiceProvider);
  const [speaker1Voice, setSpeaker1Voice] = useState(availableVoices[0]?.id || 'Puck');
  const [speaker2Voice, setSpeaker2Voice] = useState(availableVoices[1]?.id || 'Kore');

  // Play audio sample preview using Web Speech API or tone
  const playSamplePreview = (voiceName: string) => {
    if (typeof window === 'undefined') return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const sampleText = `Hello! This is the ${voiceName} voice speaking for your audio overview.`;
      const utterance = new SpeechSynthesisUtterance(sampleText);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSourceSelection = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId) ? prev.filter((id) => id !== sourceId) : [...prev, sourceId]
    );
  };

  const toggleAllSources = () => {
    if (selectedSourceIds.length === readySources.length) {
      setSelectedSourceIds([]);
    } else {
      setSelectedSourceIds(readySources.map((s) => s.id));
    }
  };

  const handleStartGeneration = async () => {
    if (selectedSourceIds.length === 0) {
      toast({
        title: 'No Sources Selected',
        description: 'Please select at least one source document to ground this generation.',
        variant: 'warning',
      });
      return;
    }

    await onGenerate({
      type,
      sourceIds: selectedSourceIds,
      options: {
        difficulty,
        length,
        itemCount,
        language,
        focusTopic: focusTopic.trim() || undefined,
        extraInstructions: extraInstructions.trim() || undefined,
        reportFormat,
        voiceStyle,
        voiceFormat,
        voiceProvider,
        speaker1Voice,
        speaker2Voice,
      },
    });

    onClose();
  };

  const titles: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
    quiz: {
      title: 'Generate Quiz',
      desc: 'Interactive multiple choice & conceptual questions testing understanding of your sources.',
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
    },
    flashcards: {
      title: 'Generate Flashcards',
      desc: 'Spaced recall cards with key definitions, terms, and active recall prompts.',
      icon: <Layers className="w-5 h-5 text-brand-400" />,
    },
    study_guide: {
      title: 'Generate Study Guide',
      desc: 'Comprehensive structured serif curriculum with key takeaways, glossary, and review questions.',
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
    },
    summary: {
      title: 'Generate Summary (Briefing Doc)',
      desc: 'Concise executive briefing with a one-paragraph overview, core takeaways, and citations.',
      icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
    },
    mind_map: {
      title: 'Generate Mind Map',
      desc: 'Interactive, zoomable and collapsible concept graph connecting source themes.',
      icon: <GitFork className="w-5 h-5 text-brand-300" />,
    },
    report: {
      title: 'Generate Report',
      desc: 'Formal academic briefing or analytical essay with grounded inline citations.',
      icon: <ScrollText className="w-5 h-5 text-rose-400" />,
    },
    voice: {
      title: 'Generate Voice Audio Overview',
      desc: 'Two co-hosts discuss the material like NotebookLM, or a single narrator reads a spoken briefing.',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
    },
  };

  const currentMeta = titles[type] || titles.quiz;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="p-6 md:p-8 max-w-xl w-full bg-[#1f1f1f] text-[#f4f4f2] rounded-3xl border border-[#303030] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#303030]">
          <div className="p-2.5 rounded-2xl bg-[#262626] border border-[#383838]">
            {currentMeta.icon}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#f4f4f2]">
              {currentMeta.title}
            </h3>
            <p className="text-xs text-[#9a9a94] font-serif mt-0.5">
              {currentMeta.desc}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Source Selector Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
                Included Sources ({selectedSourceIds.length}/{readySources.length})
              </label>
              <button
                type="button"
                onClick={toggleAllSources}
                className="text-xs text-brand-400 hover:text-brand-300 font-display font-medium"
              >
                {selectedSourceIds.length === readySources.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {readySources.length === 0 ? (
              <p className="text-xs text-amber-400/90 font-serif bg-amber-950/20 p-3 rounded-xl border border-amber-500/20">
                No processed sources found. Upload sources first.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#191919] border border-[#303030]">
                {readySources.map((source) => {
                  const isChecked = selectedSourceIds.includes(source.id);
                  return (
                    <div
                      key={source.id}
                      onClick={() => toggleSourceSelection(source.id)}
                      className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-[#262626] text-[#f4f4f2]' : 'text-[#7a7a74] hover:bg-[#202020]'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'border-[#404040] bg-[#1a1a1a]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3" />}
                      </div>
                      <FileText className="w-3.5 h-3.5 text-[#9a9a94] shrink-0" />
                      <span className="truncate flex-1 font-sans">{source.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Type-Specific Options */}
          {type === 'quiz' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                >
                  <option value="easy">Easy (Definitions &amp; Facts)</option>
                  <option value="medium">Medium (Application &amp; Concepts)</option>
                  <option value="hard">Hard (Synthesis &amp; Critical Analysis)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                  Question Count
                </label>
                <select
                  value={itemCount}
                  onChange={(e) => setItemCount(Number(e.target.value))}
                  className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
            </div>
          )}

          {type === 'flashcards' && (
            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                Deck Size
              </label>
              <select
                value={itemCount}
                onChange={(e) => setItemCount(Number(e.target.value))}
                className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
              >
                <option value={5}>5 Cards (Quick Review)</option>
                <option value={8}>8 Cards (Standard)</option>
                <option value={15}>15 Cards (Deep Recall)</option>
              </select>
            </div>
          )}

          {(type === 'study_guide' || type === 'summary' || type === 'report') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                  Length / Depth
                </label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                >
                  <option value="short">Short (Quick Overview)</option>
                  <option value="medium">Medium (Standard In-depth)</option>
                  <option value="long">Long (Comprehensive)</option>
                </select>
              </div>

              {type === 'report' && (
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Report Style
                  </label>
                  <select
                    value={reportFormat}
                    onChange={(e) => setReportFormat(e.target.value as any)}
                    className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                  >
                    <option value="briefing">Executive Briefing</option>
                    <option value="essay">Academic Essay</option>
                    <option value="blog_post">Educational Blog Post</option>
                    <option value="custom">Custom Format</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Voice-Specific Options */}
          {type === 'voice' && (
            <div className="space-y-4 p-4 rounded-2xl bg-[#191919] border border-[#303030]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Audio Style
                  </label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value as any)}
                    className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                  >
                    <option value="conversation">Conversation (2 Hosts)</option>
                    <option value="narration">Narration (1 Voice-Over)</option>
                  </select>
                </div>

                {voiceStyle === 'conversation' && (
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                      Conversation Format
                    </label>
                    <select
                      value={voiceFormat}
                      onChange={(e) => setVoiceFormat(e.target.value as any)}
                      className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                    >
                      <option value="deep_dive">Deep Dive (Detailed)</option>
                      <option value="brief">Brief (Quick overview)</option>
                      <option value="critique">Critique (Constructive)</option>
                      <option value="debate">Debate (Contrasting views)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Voice Provider Selector */}
              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                  Voice Provider
                </label>
                <select
                  value={voiceProvider}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setVoiceProvider(p);
                    const voices = getVoicesForProvider(p);
                    setSpeaker1Voice(voices[0]?.id || 'Puck');
                    setSpeaker2Voice(voices[1]?.id || 'Kore');
                  }}
                  className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                >
                  {hasGeminiKey && <option value="google">Google Gemini TTS (Puck, Kore, Charon)</option>}
                  {hasOpenAiKey && <option value="openai">OpenAI TTS (Alloy, Echo, Nova)</option>}
                  <option value="web_speech">Basic Voice (Free · Browser Speech Synthesis)</option>
                </select>
                {voiceProvider === 'web_speech' && (
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-1">
                    Free fallback: Runs client-side using browser speech synthesis. No API key needed.
                  </p>
                )}
              </div>

              {/* Host Voices Selection with Play Sample Button */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
                      {voiceStyle === 'narration' ? 'Narrator Voice' : 'Host 1 (Alex)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => playSamplePreview(speaker1Voice)}
                      className="text-[10px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-display"
                    >
                      <Volume2 className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                  <select
                    value={speaker1Voice}
                    onChange={(e) => setSpeaker1Voice(e.target.value)}
                    className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                  >
                    {availableVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                </div>

                {voiceStyle === 'conversation' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94]">
                        Host 2 (Jordan)
                      </label>
                      <button
                        type="button"
                        onClick={() => playSamplePreview(speaker2Voice)}
                        className="text-[10px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-display"
                      >
                        <Volume2 className="w-3 h-3" />
                        Preview
                      </button>
                    </div>
                    <select
                      value={speaker2Voice}
                      onChange={(e) => setSpeaker2Voice(e.target.value)}
                      className="w-full bg-[#262626] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                    >
                      {availableVoices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Length Warning */}
              {length === 'long' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-serif leading-tight">
                    Notice: Long audio generation (~30 turns) takes 30–60 seconds to synthesize. You can continue chatting in the notebook while it generates.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optional Focus Topic & Extra Instructions */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                Optional Focus Topic
              </label>
              <Input
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder="e.g. Chapter 4 neural networks, or Key Takeaways"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                Optional Instructions / Tone
              </label>
              <Input
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. Explain it like I'm a beginner, or Focus on practical formulas"
                className="text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-[#303030]">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleStartGeneration}
            disabled={isGenerating || selectedSourceIds.length === 0}
            className="text-xs font-display font-semibold min-w-[120px]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Generate Output
              </span>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

