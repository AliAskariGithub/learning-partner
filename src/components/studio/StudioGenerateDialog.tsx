'use client';

import React, { useState } from 'react';
import { Button, Input, Dialog, Tooltip } from '@/components/ui';
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
  Volume2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  FileText,
  Check,
  X,
} from 'lucide-react';
import { TTS_VOICE_CATALOG, getVoicesForProvider, ProviderId, getModelDefinition } from '@/lib/ai/providers';
import { cn } from '@/lib/utils';

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
  }) => Promise<void> | void;
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

  // Model capability check
  const selectedModelDef = getModelDefinition(selectedModelId);
  const requiredCapability: 'audioOutput' | 'structuredOutput' | 'text' =
    type === 'voice'
      ? 'audioOutput'
      : type === 'quiz' || type === 'flashcards' || type === 'mind_map'
      ? 'structuredOutput'
      : 'text';
  const isModelSupported = Boolean(selectedModelDef.capabilities[requiredCapability]);

  // Source selection state (default to all enabled ready sources)
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

  // Play audio sample preview using Web Speech API
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

  const handleStartGeneration = () => {
    if (!isModelSupported) {
      toast({
        title: 'Model Unsupported',
        description: `${selectedModelDef.name} does not support ${currentMeta.shortTitle} generation. Please switch models.`,
        variant: 'warning',
      });
      return;
    }

    if (selectedSourceIds.length === 0) {
      toast({
        title: 'No Sources Selected',
        description: 'Please select at least one source document to ground this generation.',
        variant: 'warning',
      });
      return;
    }

    // Immediately trigger background generation
    onGenerate({
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

    // Close the dialog immediately
    onClose();
  };

  const titles: Record<
    string,
    { title: string; shortTitle: string; desc: string; icon: React.ReactNode }
  > = {
    quiz: {
      title: 'Generate Quiz',
      shortTitle: 'Quiz',
      desc: 'Interactive multiple choice & conceptual questions testing understanding of your sources.',
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
    },
    flashcards: {
      title: 'Generate Flashcards',
      shortTitle: 'Flashcards',
      desc: 'Spaced recall cards with key definitions, terms, and active recall prompts.',
      icon: <Layers className="w-5 h-5 text-brand-400" />,
    },
    study_guide: {
      title: 'Generate Study Guide',
      shortTitle: 'Study Guide',
      desc: 'Comprehensive structured serif curriculum with key takeaways, glossary, and review questions.',
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
    },
    summary: {
      title: 'Generate Summary',
      shortTitle: 'Summary',
      desc: 'Concise executive briefing with a one-paragraph overview, core takeaways, and citations.',
      icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
    },
    mind_map: {
      title: 'Generate Mind Map',
      shortTitle: 'Mind Map',
      desc: 'Interactive, zoomable and collapsible concept graph connecting source themes.',
      icon: <GitFork className="w-5 h-5 text-brand-300" />,
    },
    report: {
      title: 'Generate Report',
      shortTitle: 'Report',
      desc: 'Formal academic briefing or analytical essay with grounded inline citations.',
      icon: <ScrollText className="w-5 h-5 text-rose-400" />,
    },
    voice: {
      title: 'Generate Voice Overview',
      shortTitle: 'Voice Audio',
      desc: 'Two co-hosts discuss the material like NotebookLM, or a single narrator reads a spoken briefing.',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
    },
  };

  const currentMeta = titles[type] || titles.quiz;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      hideCloseButton
      className="w-[95vw] max-w-lg md:max-w-xl max-h-[85vh] p-0 border-[#303030] bg-[#1f1f1f] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
    >
      <div className="flex flex-col h-full max-h-[85vh] text-[#f4f4f2] overflow-hidden">
        {/* Header - Fixed & Pinned */}
        <div className="px-6 py-4.5 border-b border-[#303030] bg-[#1a1a1a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-[#262626] border border-[#383838] shrink-0">
              {currentMeta.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-base text-[#f4f4f2] truncate">
                {currentMeta.title}
              </h3>
              <p className="text-xs text-[#9a9a94] font-serif truncate mt-0.5">
                {currentMeta.desc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#282828] transition shrink-0 ml-3 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable with clean single scrollbar */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 scrollbar-thin scrollbar-thumb-[#303030] scrollbar-track-transparent">
          {/* Unsupported Model Warning Banner */}
          {!isModelSupported && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-display font-bold text-xs text-rose-300">
                  {selectedModelDef.name} Does Not Support {currentMeta.shortTitle}
                </p>
                <p className="text-[11px] text-rose-300/80 font-serif mt-0.5 leading-relaxed">
                  The currently selected model lacks {requiredCapability} support. Please switch to a compatible model (such as Gemini 2.5 Flash or GPT-4o) in the notebook header.
                </p>
              </div>
            </div>
          )}

          {/* Source Selector Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                Included Sources ({selectedSourceIds.length}/{readySources.length})
              </label>
              <button
                type="button"
                onClick={toggleAllSources}
                className="text-xs text-brand-400 hover:text-brand-300 font-display font-medium cursor-pointer"
              >
                {selectedSourceIds.length === readySources.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {readySources.length === 0 ? (
              <p className="text-xs text-amber-400/90 font-serif bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20">
                No processed sources found. Upload sources first.
              </p>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#141414] border border-[#2c2c2c] scrollbar-thin scrollbar-thumb-[#303030]">
                {readySources.map((source) => {
                  const isChecked = selectedSourceIds.includes(source.id);
                  return (
                    <div
                      key={source.id}
                      onClick={() => toggleSourceSelection(source.id)}
                      className={cn(
                        'flex items-center gap-2.5 p-2 rounded-xl cursor-pointer text-xs transition-colors border',
                        isChecked
                          ? 'bg-[#242424] text-[#f4f4f2] border-[#383838]'
                          : 'bg-transparent text-[#8a8a84] border-transparent hover:bg-[#1a1a1a] hover:text-[#d0d0cc]'
                      )}
                    >
                      <div
                        className={cn(
                          'w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                          isChecked
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'border-[#404040] bg-[#1a1a1a]'
                        )}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <FileText className="w-3.5 h-3.5 text-[#9a9a94] shrink-0" />
                      <span className="truncate flex-1 font-sans">{source.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Type-Specific Options with Non-Truncating Segmented Controls */}
          {type === 'quiz' && (
            <div className="space-y-4">
              {/* Difficulty Level Segmented Control */}
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-2xl border border-[#303030]">
                  {[
                    { id: 'easy', label: 'Easy', desc: 'Facts & Recall' },
                    { id: 'medium', label: 'Medium', desc: 'Concepts' },
                    { id: 'hard', label: 'Hard', desc: 'Critical Analysis' },
                  ].map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      onClick={() => setDifficulty(lvl.id as any)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-center transition-all cursor-pointer',
                        difficulty === lvl.id
                          ? 'bg-[#282828] text-brand-300 font-bold border border-brand-500/50 shadow-sm'
                          : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#1c1c1c] border border-transparent'
                      )}
                    >
                      <div className="text-xs font-display">{lvl.label}</div>
                      <div className="text-[10px] font-serif text-[#7a7a74]">{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count Segmented Control */}
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Question Count
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-2xl border border-[#303030]">
                  {[
                    { count: 3, label: '3 Questions', desc: 'Quick check' },
                    { count: 5, label: '5 Questions', desc: 'Recommended' },
                    { count: 10, label: '10 Questions', desc: 'Comprehensive' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.count}
                      onClick={() => setItemCount(item.count)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-center transition-all cursor-pointer',
                        itemCount === item.count
                          ? 'bg-[#282828] text-brand-300 font-bold border border-brand-500/50 shadow-sm'
                          : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#1c1c1c] border border-transparent'
                      )}
                    >
                      <div className="text-xs font-display">{item.label}</div>
                      <div className="text-[10px] font-serif text-[#7a7a74]">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {type === 'flashcards' && (
            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                Deck Size
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-2xl border border-[#303030]">
                {[
                  { count: 5, label: '5 Cards', desc: 'Quick Review' },
                  { count: 8, label: '8 Cards', desc: 'Standard' },
                  { count: 15, label: '15 Cards', desc: 'Deep Recall' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.count}
                    onClick={() => setItemCount(item.count)}
                    className={cn(
                      'py-2 px-2 rounded-xl text-center transition-all cursor-pointer',
                      itemCount === item.count
                        ? 'bg-[#282828] text-brand-300 font-bold border border-brand-500/50 shadow-sm'
                        : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#1c1c1c] border border-transparent'
                    )}
                  >
                    <div className="text-xs font-display">{item.label}</div>
                    <div className="text-[10px] font-serif text-[#7a7a74]">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(type === 'study_guide' || type === 'summary' || type === 'report') && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Length / Depth
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#141414] rounded-2xl border border-[#303030]">
                  {[
                    { id: 'short', label: 'Short', desc: 'Quick overview' },
                    { id: 'medium', label: 'Medium', desc: 'Standard in-depth' },
                    { id: 'long', label: 'Long', desc: 'Comprehensive' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setLength(item.id as any)}
                      className={cn(
                        'py-2 px-2 rounded-xl text-center transition-all cursor-pointer',
                        length === item.id
                          ? 'bg-[#282828] text-brand-300 font-bold border border-brand-500/50 shadow-sm'
                          : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#1c1c1c] border border-transparent'
                      )}
                    >
                      <div className="text-xs font-display">{item.label}</div>
                      <div className="text-[10px] font-serif text-[#7a7a74]">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {type === 'report' && (
                <div>
                  <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                    Report Style
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[#141414] rounded-2xl border border-[#303030]">
                    {[
                      { id: 'briefing', label: 'Executive Briefing' },
                      { id: 'essay', label: 'Academic Essay' },
                      { id: 'blog_post', label: 'Educational Post' },
                      { id: 'custom', label: 'Custom Format' },
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setReportFormat(item.id as any)}
                        className={cn(
                          'py-2 px-2 rounded-xl text-center transition-all cursor-pointer text-xs font-display',
                          reportFormat === item.id
                            ? 'bg-[#282828] text-brand-300 font-bold border border-brand-500/50 shadow-sm'
                            : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#1c1c1c] border border-transparent'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voice-Specific Options */}
          {type === 'voice' && (
            <div className="space-y-4 p-4 rounded-2xl bg-[#141414] border border-[#303030]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Audio Style
                  </label>
                  <select
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value as any)}
                    className="w-full bg-[#1f1f1f] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                  >
                    <option value="conversation">Conversation (2 Hosts)</option>
                    <option value="narration">Narration (1 Voice)</option>
                  </select>
                </div>

                {voiceStyle === 'conversation' && (
                  <div>
                    <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                      Format
                    </label>
                    <select
                      value={voiceFormat}
                      onChange={(e) => setVoiceFormat(e.target.value as any)}
                      className="w-full bg-[#1f1f1f] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                    >
                      <option value="deep_dive">Deep Dive</option>
                      <option value="brief">Brief</option>
                      <option value="critique">Critique</option>
                      <option value="debate">Debate</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Voice Provider Selector */}
              <div>
                <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-1.5">
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
                  className="w-full bg-[#1f1f1f] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
                >
                  {hasGeminiKey && <option value="google">Google Gemini TTS (Puck, Kore, Charon)</option>}
                  {hasOpenAiKey && <option value="openai">OpenAI TTS (Alloy, Echo, Nova)</option>}
                  <option value="web_speech">Basic Voice (Free · Browser Speech)</option>
                </select>
              </div>

              {/* Host Voices Selection with Play Sample Button */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                      {voiceStyle === 'narration' ? 'Narrator Voice' : 'Host 1 (Alex)'}
                    </label>
                    <button
                      type="button"
                      onClick={() => playSamplePreview(speaker1Voice)}
                      className="text-[10px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-display cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      Preview
                    </button>
                  </div>
                  <select
                    value={speaker1Voice}
                    onChange={(e) => setSpeaker1Voice(e.target.value)}
                    className="w-full bg-[#1f1f1f] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
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
                      <label className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                        Host 2 (Jordan)
                      </label>
                      <button
                        type="button"
                        onClick={() => playSamplePreview(speaker2Voice)}
                        className="text-[10px] text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 font-display cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                        Preview
                      </button>
                    </div>
                    <select
                      value={speaker2Voice}
                      onChange={(e) => setSpeaker2Voice(e.target.value)}
                      className="w-full bg-[#1f1f1f] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500"
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

              {length === 'long' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="font-serif leading-tight">
                    Long audio overview will generate in the background while you continue working.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Optional Focus Topic & Extra Instructions */}
          <div className="space-y-3 pt-1 border-t border-[#2c2c2c]">
            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                Optional Focus Topic
              </label>
              <Input
                value={focusTopic}
                onChange={(e) => setFocusTopic(e.target.value)}
                placeholder="e.g. Chapter 4 neural networks, or Key Takeaways"
                className="text-xs bg-[#141414] border-[#303030]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                Optional Instructions / Tone
              </label>
              <Input
                value={extraInstructions}
                onChange={(e) => setExtraInstructions(e.target.value)}
                placeholder="e.g. Explain it like I'm a beginner, or Focus on practical formulas"
                className="text-xs bg-[#141414] border-[#303030]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions - ALWAYS Pinned, 100% Visible, Never Clipped! */}
        <div className="px-6 py-4 border-t border-[#303030] bg-[#161616] flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-[#9a9a94]">
            {selectedSourceIds.length} {selectedSourceIds.length === 1 ? 'source' : 'sources'} selected
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartGeneration}
              disabled={!isModelSupported || isGenerating || selectedSourceIds.length === 0}
              className="text-xs font-display font-semibold min-w-[140px] shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {!isModelSupported ? (
                <span className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Model Unsupported
                </span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Generate {currentMeta.shortTitle}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
