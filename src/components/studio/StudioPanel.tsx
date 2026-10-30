'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Dialog, Tooltip, GlidingHighlight } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { StudioOutput, Source, Notebook } from '@/db/schema';
import { SafeApiKey } from '@/app/app/api-key-actions';
import { getModelDefinition } from '@/lib/ai/providers';
import {
  HelpCircle,
  Layers,
  BookOpen,
  AlignLeft,
  GitFork,
  ScrollText,
  Mic,
  Sparkles,
  MoreVertical,
  Pencil,
  Trash2,
  RotateCcw,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Headphones,
  FileText,
  Loader2,
} from 'lucide-react';
import {
  generateStudioOutput,
  renameStudioOutput,
  deleteStudioOutput,
  regenerateStudioOutput,
} from '@/app/app/studio-actions';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { StudioGenerateDialog } from './StudioGenerateDialog';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { QuizViewer } from './viewers/QuizViewer';
import { FlashcardsViewer } from './viewers/FlashcardsViewer';
import { StudyGuideViewer } from './viewers/StudyGuideViewer';
import { SummaryViewer } from './viewers/SummaryViewer';
import { MindMapViewer } from './viewers/MindMapViewer';
import { ReportViewer } from './viewers/ReportViewer';
import { VoicePlayer } from './VoicePlayer';

function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'Just now';
  const then = new Date(date).getTime();
  if (isNaN(then)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export interface StudioPanelProps {
  notebook: Notebook;
  sources: Source[];
  outputs: StudioOutput[];
  onRefreshOutputs?: () => void;
  selectedModelId: string;
  userKeys?: SafeApiKey[];
  onOpenSourceViewer?: (source: Source) => void;
  activeConversationId?: string | null;
  activeConversationTitle?: string | null;
  onEnsureConversation?: (title?: string) => Promise<string>;
}

export function StudioPanel({
  notebook,
  sources,
  outputs = [],
  onRefreshOutputs,
  selectedModelId,
  userKeys = [],
  onOpenSourceViewer,
  activeConversationId,
  activeConversationTitle,
  onEnsureConversation,
}: StudioPanelProps) {
  const { toast } = useToast();
  const { t } = useLanguage();

  // Local outputs state synchronized with parent outputs for instant optimistic rendering
  const [localOutputs, setLocalOutputs] = useState<StudioOutput[]>(outputs);

  useEffect(() => {
    setLocalOutputs(outputs);
  }, [outputs]);

  // Scoped outputs strictly isolated for the active chat / conversation
  const chatOutputs = React.useMemo(() => {
    if (!activeConversationId) return [];
    return localOutputs.filter(
      (o) => o.conversationId === activeConversationId
    );
  }, [localOutputs, activeConversationId]);

  // Active generation dialog
  const [generateDialogType, setGenerateDialogType] = useState<
    'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice' | null
  >(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Active output viewer dialog
  const [activeViewerOutput, setActiveViewerOutput] = useState<StudioOutput | null>(null);

  // Rename Dialog State
  const [renameTargetOutput, setRenameTargetOutput] = useState<StudioOutput | null>(null);
  const [renameInputText, setRenameInputText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Action Menu Open State
  const [openMenuOutputId, setOpenMenuOutputId] = useState<string | null>(null);

  // Floating Mini Voice Player State
  const [miniVoiceOutput, setMiniVoiceOutput] = useState<StudioOutput | null>(null);

  // Hover state for directional gliding highlight across studio tiles
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  // Hover state for directional gliding highlight across generated outputs
  const [hoveredOutputId, setHoveredOutputId] = useState<string | null>(null);

  // Active model definition and capabilities
  const activeModelDef = getModelDefinition(selectedModelId);

  // ----------------------------------------------------
  // Exactly 7 Studio Tiles in prescribed order
  // ----------------------------------------------------
  const studioTiles = [
    {
      id: 'quiz' as const,
      title: t('quiz_title'),
      desc: t('quiz_desc'),
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      badge: t('badge_interactive'),
      capability: 'structuredOutput' as const,
    },
    {
      id: 'flashcards' as const,
      title: t('flashcards_title'),
      desc: t('flashcards_desc'),
      icon: <Layers className="w-5 h-5 text-brand-400" />,
      badge: t('badge_spaced_recall'),
      capability: 'structuredOutput' as const,
    },
    {
      id: 'study_guide' as const,
      title: t('study_guide_title'),
      desc: t('study_guide_desc'),
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      badge: t('badge_curriculum'),
      capability: 'text' as const,
    },
    {
      id: 'summary' as const,
      title: t('summary_title'),
      desc: t('summary_desc'),
      icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
      badge: t('badge_synthesis'),
      capability: 'text' as const,
    },
    {
      id: 'mind_map' as const,
      title: t('mind_map_title'),
      desc: t('mind_map_desc'),
      icon: <GitFork className="w-5 h-5 text-brand-300" />,
      badge: t('badge_graph'),
      capability: 'structuredOutput' as const,
    },
    {
      id: 'report' as const,
      title: t('report_title'),
      desc: t('report_desc'),
      icon: <ScrollText className="w-5 h-5 text-rose-400" />,
      badge: t('badge_citations'),
      capability: 'text' as const,
    },
    {
      id: 'voice' as const,
      title: t('voice_title'),
      desc: t('voice_desc'),
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      badge: t('badge_audio_overview'),
      capability: 'audioOutput' as const,
    },
  ];

  const handleTileClick = (tileId: typeof studioTiles[number]['id']) => {
    setGenerateDialogType(tileId);
  };

  const handleExecuteGenerate = async (params: {
    type: 'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice';
    sourceIds: string[];
    options: any;
  }) => {
    // 1. Immediately close the dialog
    setGenerateDialogType(null);

    // 2. Resolve title
    const typeTitles: Record<string, string> = {
      quiz: 'Comprehensive Knowledge Quiz',
      flashcards: 'Active Recall Flashcards',
      study_guide: 'Complete Study Guide',
      summary: 'Executive Briefing Document',
      mind_map: 'Core Concepts Mind Map',
      report: 'Deep Synthesis Report',
      voice: 'Audio Overview Discussion',
    };
    const title = typeTitles[params.type] || 'Studio Synthesis';

    // 3. Resolve conversation ID for strict chat isolation
    let targetConvId = activeConversationId;
    if (!targetConvId && onEnsureConversation) {
      try {
        targetConvId = await onEnsureConversation(title);
      } catch (e) {
        console.warn('Failed to ensure conversation:', e);
      }
    }

    // 4. Immediately insert optimistic generating card in local outputs
    const tempId = `temp-${Date.now()}`;
    const optimisticOutput: StudioOutput = {
      id: tempId,
      notebookId: notebook.id,
      userId: notebook.userId,
      type: params.type,
      title,
      content: null,
      sourceIds: params.sourceIds,
      model: selectedModelId,
      conversationId: targetConvId || null,
      status: 'generating',
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      script: null,
      audioKeys: null,
      durationSeconds: null,
      voiceConfig: null,
    };

    setLocalOutputs((prev) => [optimisticOutput, ...prev.filter((o) => o.id !== tempId)]);

    // 5. Semantic info toast
    toast({
      title: 'Generating Output',
      description: `${title} is synthesizing in the background with ${activeModelDef.name}...`,
      variant: 'info',
    });

    // 6. Trigger generation in background with targetConvId
    generateStudioOutput({
      notebookId: notebook.id,
      conversationId: targetConvId || null,
      type: params.type,
      sourceIds: params.sourceIds,
      modelId: selectedModelId,
      options: params.options,
    })
      .then((res) => {
        if (res.success) {
          toast({
            title: 'Output Ready',
            description: `${title} generated successfully.`,
            variant: 'success',
          });
          if (onRefreshOutputs) onRefreshOutputs();
        } else {
          setLocalOutputs((prev) =>
            prev.map((o) =>
              o.id === tempId
                ? {
                    ...o,
                    id: res.outputId || tempId,
                    status: 'failed',
                    errorMessage: res.error || 'Generation failed.',
                  }
                : o
            )
          );
          toast({
            title: 'Generation Failed',
            description: res.error || 'Could not complete synthesis. Click retry on the card.',
            variant: 'error',
          });
          if (onRefreshOutputs) onRefreshOutputs();
        }
      })
      .catch((err: any) => {
        setLocalOutputs((prev) =>
          prev.map((o) =>
            o.id === tempId
              ? {
                  ...o,
                  status: 'failed',
                  errorMessage: err.message || 'Generation failed.',
                }
              : o
          )
        );
        toast({
          title: 'Generation Error',
          description: err.message || 'An error occurred during generation.',
          variant: 'error',
        });
        if (onRefreshOutputs) onRefreshOutputs();
      });
  };

  const handleRenameClick = (output: StudioOutput) => {
    setRenameTargetOutput(output);
    setRenameInputText(output.title);
    setOpenMenuOutputId(null);
  };

  const handleConfirmRename = async () => {
    if (!renameTargetOutput) return;
    setIsRenaming(true);
    try {
      const res = await renameStudioOutput(renameTargetOutput.id, renameInputText);
      if (res.success) {
        toast({ title: 'Renamed', description: 'Output title updated.', variant: 'success' });
        setRenameTargetOutput(null);
        if (onRefreshOutputs) onRefreshOutputs();
      } else {
        toast({ title: 'Rename Failed', description: res.error, variant: 'error' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    setOpenMenuOutputId(null);
    try {
      const res = await deleteStudioOutput(outputId);
      if (res.success) {
        toast({ title: 'Deleted', description: 'Output removed.', variant: 'success' });
        setLocalOutputs((prev) => prev.filter((o) => o.id !== outputId));
        if (activeViewerOutput?.id === outputId) setActiveViewerOutput(null);
        if (miniVoiceOutput?.id === outputId) setMiniVoiceOutput(null);
        if (onRefreshOutputs) onRefreshOutputs();
      } else {
        toast({ title: 'Delete Failed', description: res.error, variant: 'error' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  const handleRegenerateOutput = async (outputId: string) => {
    setOpenMenuOutputId(null);
    // Mark as generating locally
    setLocalOutputs((prev) =>
      prev.map((o) => (o.id === outputId ? { ...o, status: 'generating', errorMessage: null } : o))
    );
    toast({ title: 'Regenerating Output', description: 'Running synthesis in background...', variant: 'info' });
    try {
      const res = await regenerateStudioOutput(outputId, selectedModelId);
      if (res.success) {
        toast({ title: 'Regenerated', description: 'Updated with latest sources.', variant: 'success' });
        if (onRefreshOutputs) onRefreshOutputs();
      } else {
        setLocalOutputs((prev) =>
          prev.map((o) =>
            o.id === outputId ? { ...o, status: 'failed', errorMessage: res.error || 'Regenerate failed.' } : o
          )
        );
        toast({ title: 'Regenerate Failed', description: res.error, variant: 'error' });
      }
    } catch (err: any) {
      setLocalOutputs((prev) =>
        prev.map((o) =>
          o.id === outputId ? { ...o, status: 'failed', errorMessage: err.message || 'Regenerate error.' } : o
        )
      );
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  const handleExportOutput = (output: StudioOutput) => {
    setOpenMenuOutputId(null);
    const textToExport = output.content || JSON.stringify(output.script || {}, null, 2);
    const blob = new Blob([textToExport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${output.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'File downloaded.', variant: 'success' });
  };

  const handleOpenOutputViewer = (output: StudioOutput) => {
    setActiveViewerOutput(output);
  };

  const handleListenFromViewer = (textToRead: string) => {
    // Open Voice dialog
    setGenerateDialogType('voice');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-amber-400" />;
      case 'flashcards':
        return <Layers className="w-4 h-4 text-brand-400" />;
      case 'study_guide':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      case 'summary':
        return <AlignLeft className="w-4 h-4 text-cyan-400" />;
      case 'mind_map':
        return <GitFork className="w-4 h-4 text-brand-300" />;
      case 'report':
        return <ScrollText className="w-4 h-4 text-rose-400" />;
      case 'voice':
        return <Mic className="w-4 h-4 text-purple-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#1f1f1f] text-[#f4f4f2] overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#303030]">
      {/* 7 Studio Action Tiles */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-display font-bold text-[#9a9a94] mb-2.5 px-1">
          {t('studio_synthesizers')}
        </p>

        <div
          className="grid grid-cols-2 gap-2.5 relative"
          onMouseLeave={() => setHoveredTileId(null)}
        >
          {studioTiles.map((tile) => {
            const isSupported = Boolean(activeModelDef.capabilities[tile.capability]);

            const tileElement = (
              <div
                key={tile.id}
                className="relative h-full"
                onMouseEnter={() => isSupported && setHoveredTileId(tile.id)}
              >
                {/* Gliding directional highlight across studio synthesizers */}
                {isSupported && (
                  <GlidingHighlight
                    activeId={null}
                    hoverId={hoveredTileId}
                    itemId={tile.id}
                    layoutId="studio-synthesizers-glide"
                    className="rounded-2xl bg-[#2a2a2a] border border-brand-500/60 shadow-lg shadow-brand-500/15 pointer-events-none"
                  />
                )}

                <div
                  onClick={() => {
                    if (!isSupported) {
                      toast({
                        title: 'Model Unsupported',
                        description: `${activeModelDef.name} does not support ${tile.title} generation. Please switch to a supported model.`,
                        variant: 'warning',
                      });
                      return;
                    }
                    handleTileClick(tile.id);
                  }}
                  className={`group relative z-10 p-3 rounded-2xl border transition-colors flex flex-col justify-between min-h-[108px] w-full text-left h-full ${
                    isSupported
                      ? 'bg-[#262626]/85 border-[#303030] hover:border-transparent cursor-pointer active:scale-[0.99]'
                      : 'bg-[#181818] border-dashed border-[#3a3a3a] cursor-not-allowed opacity-45 grayscale-[40%]'
                  }`}
                >
                  <div className="flex items-start justify-between w-full gap-1">
                    <div
                      className={`p-2 rounded-xl bg-[#191919] border border-[#303030] transition-transform duration-150 shrink-0 ${
                        isSupported ? 'group-hover:scale-105' : 'opacity-60'
                      }`}
                    >
                      {tile.icon}
                    </div>
                    {isSupported ? (
                      <span className="text-[9px] font-display font-medium px-2 py-0.5 rounded-full bg-[#191919] text-[#9a9a94] group-hover:text-[#f4f4f2] border border-[#303030] shrink-0">
                        {tile.badge}
                      </span>
                    ) : (
                      <span
                        className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0 max-w-[80px] truncate"
                        title="Model Unsupported"
                      >
                        <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">Unsupported</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <h3
                      className={`text-xs font-display font-bold transition-colors ${
                        isSupported ? 'text-[#f4f4f2] group-hover:text-brand-300' : 'text-[#7a7a74]'
                      }`}
                    >
                      {tile.title}
                    </h3>
                    {isSupported ? (
                      <p className="text-[10px] text-[#9a9a94] font-serif line-clamp-2 mt-0.5 leading-snug">
                        {tile.desc}
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-400/90 font-serif line-clamp-2 mt-0.5 leading-snug">
                        {t('model_unsupported_desc', activeModelDef.name)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );

            if (!isSupported) {
              return (
                <Tooltip
                  key={tile.id}
                  content={`${activeModelDef.name} does not support ${tile.title} generation. Select a model with ${tile.capability} support in the model switcher.`}
                >
                  <div className="w-full h-full">{tileElement}</div>
                </Tooltip>
              );
            }

            return (
              <div key={tile.id} className="w-full h-full">
                {tileElement}
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Outputs List Section */}
      <div className="pt-2 border-t border-[#303030]">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <p className="text-[11px] uppercase tracking-wider font-display font-bold text-[#9a9a94]">
            {t('generated_outputs')}
          </p>
          <span className="text-[10px] text-[#9a9a94] font-mono shrink-0">
            {chatOutputs.length} {chatOutputs.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {chatOutputs.length === 0 ? (
          <div className="py-8 text-center px-4 rounded-2xl bg-[#262626]/50 border border-dashed border-[#303030]">
            <Sparkles className="w-6 h-6 text-[#9a9a94] mx-auto mb-2 opacity-40" />
            <p className="text-xs font-display font-semibold text-[#f4f4f2]">{t('no_outputs_yet')}</p>
            <p className="text-[11px] text-[#9a9a94] font-serif mt-1 max-w-[220px] mx-auto leading-relaxed">
              {t('no_outputs_desc')}
            </p>
          </div>
        ) : (
          <div
            className="space-y-2 relative"
            onMouseLeave={() => setHoveredOutputId(null)}
          >
            {chatOutputs.map((out) => {
              const isMenuOpen = openMenuOutputId === out.id;
              const sourceCount = Array.isArray(out.sourceIds) ? out.sourceIds.length : 0;
              const isGeneratingItem = out.status === 'generating';
              const isFailedItem = out.status === 'failed';
              const isReadyItem = out.status === 'ready';

              return (
                <div
                  key={out.id}
                  className={`relative ${isMenuOpen ? 'z-40' : 'z-auto'}`}
                  onMouseEnter={() => setHoveredOutputId(out.id)}
                >
                  <GlidingHighlight
                    activeId={activeViewerOutput?.id === out.id ? out.id : null}
                    hoverId={hoveredOutputId}
                    itemId={out.id}
                    layoutId="studio-generated-outputs-glide"
                    className="rounded-2xl bg-[#2a2a2a] border border-brand-500/50 shadow-md shadow-brand-500/10 pointer-events-none"
                  />

                  <div
                    className={`group relative ${isMenuOpen ? 'z-40' : 'z-10'} p-3 rounded-2xl border transition-colors flex items-start justify-between gap-3 shadow-sm ${
                      isGeneratingItem
                        ? 'bg-[#25221b]/80 border-amber-500/40 shadow-amber-500/5'
                        : isFailedItem
                        ? 'bg-[#261f20]/80 border-rose-500/40'
                        : 'bg-[#262626]/85 border-[#303030] hover:border-transparent'
                    }`}
                  >
                  {/* Left Icon & Title */}
                  <div
                    onClick={() => {
                      if (isReadyItem) {
                        handleOpenOutputViewer(out);
                      } else if (isGeneratingItem) {
                        toast({
                          title: 'Synthesizing in Progress',
                          description: 'This output is generating in the background. It will be ready in a moment.',
                          variant: 'info',
                        });
                      }
                    }}
                    className={`flex items-start gap-2.5 flex-1 min-w-0 ${
                      isReadyItem ? 'cursor-pointer' : isGeneratingItem ? 'cursor-wait' : 'cursor-default'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 border ${
                        isGeneratingItem
                          ? 'bg-amber-950/40 border-amber-500/30'
                          : isFailedItem
                          ? 'bg-rose-950/40 border-rose-500/30'
                          : 'bg-[#191919] border-[#303030]'
                      }`}
                    >
                      {isGeneratingItem ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        getTypeIcon(out.type)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4
                          className={`text-xs font-display font-bold truncate transition-colors ${
                            isReadyItem
                              ? 'text-[#f4f4f2] group-hover:text-brand-300'
                              : isGeneratingItem
                              ? 'text-amber-200'
                              : 'text-rose-200'
                          }`}
                        >
                          {out.title}
                        </h4>

                        {/* Semantic Status Badges */}
                        {isFailedItem && (
                          <span
                            className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0"
                            title={out.errorMessage || 'Failed'}
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            Failed
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-[#9a9a94] font-serif mt-0.5 truncate">
                        {isGeneratingItem ? (
                          <Shimmer
                            as="span"
                            duration={2.2}
                            baseColor="#d97706"
                            highlightColor="#fef3c7"
                            className="font-serif text-[10px] font-medium"
                          >
                            Synthesizing in background...
                          </Shimmer>
                        ) : isFailedItem ? (
                          <span className="text-rose-400/90 font-medium truncate block">
                            {out.errorMessage || 'Generation failed. Click retry.'}
                          </span>
                        ) : (
                          <span>
                            {sourceCount} {sourceCount === 1 ? 'source' : 'sources'} · {formatRelativeTime(out.createdAt)}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Quick Retry on Failure or Dropdown Menu */}
                  <div className="relative shrink-0 flex items-center gap-1.5">
                    {isFailedItem && (
                      <button
                        type="button"
                        onClick={() => handleRegenerateOutput(out.id)}
                        className="px-2 py-1 rounded-lg text-[10px] font-display font-medium bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Retry generation"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Retry
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setOpenMenuOutputId(isMenuOpen ? null : out.id)}
                      className="p-1 rounded-lg text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#303030] transition-colors cursor-pointer"
                      title="Output actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#1a1a1a] border border-[#383838] shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                        {isReadyItem && (
                          <button
                            type="button"
                            onClick={() => handleRenameClick(out)}
                            className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                          >
                            <Pencil className="w-3 h-3 text-[#9a9a94]" />
                            Rename
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRegenerateOutput(out.id)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-[#9a9a94]" />
                          Regenerate
                        </button>
                        {isReadyItem && (
                          <button
                            type="button"
                            onClick={() => handleExportOutput(out)}
                            className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3 h-3 text-[#9a9a94]" />
                            Export
                          </button>
                        )}
                        <div className="h-px bg-[#303030] my-1" />
                        <button
                          type="button"
                          onClick={() => handleDeleteOutput(out.id)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-rose-400 hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Options Dialog */}
      {generateDialogType && (
        <StudioGenerateDialog
          isOpen={Boolean(generateDialogType)}
          onClose={() => setGenerateDialogType(null)}
          type={generateDialogType}
          sources={sources}
          userKeys={userKeys}
          selectedModelId={selectedModelId}
          onGenerate={handleExecuteGenerate}
          isGenerating={isGenerating}
        />
      )}

      {/* Rename Dialog */}
      {renameTargetOutput && (
        <Dialog open={Boolean(renameTargetOutput)} onOpenChange={() => setRenameTargetOutput(null)}>
          <div className="p-6 max-w-sm w-full bg-[#1f1f1f] text-[#f4f4f2] rounded-3xl border border-[#303030] shadow-2xl">
            <h3 className="font-display font-bold text-base text-[#f4f4f2] mb-3">
              Rename Studio Output
            </h3>
            <Input
              value={renameInputText}
              onChange={(e) => setRenameInputText(e.target.value)}
              placeholder="Output title"
              className="text-xs mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRenameTargetOutput(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRename}
                disabled={isRenaming || !renameInputText.trim()}
                className="text-xs font-display font-semibold"
              >
                {isRenaming ? 'Saving...' : 'Save Title'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Full-Screen Output Viewer Dialog */}
      {activeViewerOutput && (
        <Dialog
          open={Boolean(activeViewerOutput)}
          onOpenChange={() => setActiveViewerOutput(null)}
          hideCloseButton
          className="w-[95vw] max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[88vh] max-h-[90vh] p-0 border-[#303030] bg-[#191919] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
        >
          {activeViewerOutput.type === 'quiz' && (
            <QuizViewer content={activeViewerOutput.content || '{}'} onClose={() => setActiveViewerOutput(null)} />
          )}
          {activeViewerOutput.type === 'flashcards' && (
            <FlashcardsViewer
              content={activeViewerOutput.content || '{}'}
              onClose={() => setActiveViewerOutput(null)}
            />
          )}
          {activeViewerOutput.type === 'study_guide' && (
            <StudyGuideViewer
              title={activeViewerOutput.title}
              content={activeViewerOutput.content || ''}
              onListen={handleListenFromViewer}
              onClose={() => setActiveViewerOutput(null)}
            />
          )}
          {activeViewerOutput.type === 'summary' && (
            <SummaryViewer
              title={activeViewerOutput.title}
              content={activeViewerOutput.content || ''}
              onListen={handleListenFromViewer}
              onClose={() => setActiveViewerOutput(null)}
            />
          )}
          {activeViewerOutput.type === 'mind_map' && (
            <MindMapViewer
              content={activeViewerOutput.content || '{}'}
              onOpenSource={(srcId) => {
                const found = sources.find((s) => s.id === srcId);
                if (found && onOpenSourceViewer) onOpenSourceViewer(found);
              }}
              onClose={() => setActiveViewerOutput(null)}
            />
          )}
          {activeViewerOutput.type === 'report' && (
            <ReportViewer
              title={activeViewerOutput.title}
              content={activeViewerOutput.content || ''}
              onListen={handleListenFromViewer}
              onClose={() => setActiveViewerOutput(null)}
            />
          )}
          {activeViewerOutput.type === 'voice' && (
            <VoicePlayer
              title={activeViewerOutput.title}
              script={activeViewerOutput.script}
              audioKeys={activeViewerOutput.audioKeys}
              durationSeconds={activeViewerOutput.durationSeconds}
              voiceConfig={activeViewerOutput.voiceConfig}
              onClose={() => setActiveViewerOutput(null)}
              onToggleMini={() => {
                setMiniVoiceOutput(activeViewerOutput);
                setActiveViewerOutput(null);
              }}
            />
          )}
        </Dialog>
      )}

      {/* Persistent Floating Mini Voice Player */}
      {miniVoiceOutput && (
        <VoicePlayer
          isMiniPlayer
          title={miniVoiceOutput.title}
          script={miniVoiceOutput.script}
          audioKeys={miniVoiceOutput.audioKeys}
          durationSeconds={miniVoiceOutput.durationSeconds}
          voiceConfig={miniVoiceOutput.voiceConfig}
          onClose={() => setMiniVoiceOutput(null)}
          onToggleMini={() => {
            setActiveViewerOutput(miniVoiceOutput);
            setMiniVoiceOutput(null);
          }}
        />
      )}
    </div>
  );
}
