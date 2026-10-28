'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Dialog } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { StudioOutput, Source, Notebook } from '@/db/schema';
import { SafeApiKey } from '@/app/app/api-key-actions';
import { CapabilityGate } from '@/components/ai/CapabilityGate';
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
  CheckCircle2,
  Clock,
  Headphones,
  FileText,
} from 'lucide-react';
import {
  generateStudioOutput,
  renameStudioOutput,
  deleteStudioOutput,
  regenerateStudioOutput,
} from '@/app/app/studio-actions';
import { StudioGenerateDialog } from './StudioGenerateDialog';
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
}

export function StudioPanel({
  notebook,
  sources,
  outputs = [],
  onRefreshOutputs,
  selectedModelId,
  userKeys = [],
  onOpenSourceViewer,
}: StudioPanelProps) {
  const { toast } = useToast();

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

  // ----------------------------------------------------
  // Exactly 7 Studio Tiles in prescribed order
  // ----------------------------------------------------
  const studioTiles = [
    {
      id: 'quiz' as const,
      title: 'Quiz',
      desc: 'Multiple choice & conceptual knowledge check questions.',
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      badge: 'Interactive',
      capability: 'structuredOutput' as const,
    },
    {
      id: 'flashcards' as const,
      title: 'Flashcards',
      desc: 'Key definitions, terms, and active recall cards.',
      icon: <Layers className="w-5 h-5 text-brand-400" />,
      badge: 'Spaced Recall',
      capability: 'structuredOutput' as const,
    },
    {
      id: 'study_guide' as const,
      title: 'Study Guide',
      desc: 'Structured serif curriculum with key takeaways.',
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      badge: 'Curriculum',
      capability: 'text' as const,
    },
    {
      id: 'summary' as const,
      title: 'Summary (briefing doc)',
      desc: 'Concise executive briefing with one-paragraph overview and citations.',
      icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
      badge: 'Synthesis',
      capability: 'text' as const,
    },
    {
      id: 'mind_map' as const,
      title: 'Mind Map',
      desc: 'Interactive, zoomable and collapsible concept graph.',
      icon: <GitFork className="w-5 h-5 text-brand-300" />,
      badge: 'Graph',
      capability: 'structuredOutput' as const,
    },
    {
      id: 'report' as const,
      title: 'Report',
      desc: 'Formal academic briefing or analytical essay with citations.',
      icon: <ScrollText className="w-5 h-5 text-rose-400" />,
      badge: 'Citations',
      capability: 'text' as const,
    },
    {
      id: 'voice' as const,
      title: 'Voice',
      desc: 'Two co-hosts discuss sources, or single voice-over narration.',
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      badge: 'Audio Overview',
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
    setIsGenerating(true);
    try {
      const res = await generateStudioOutput({
        notebookId: notebook.id,
        type: params.type,
        sourceIds: params.sourceIds,
        modelId: selectedModelId,
        options: params.options,
      });

      if (res.success) {
        toast({
          title: 'Output Ready',
          description: `Generated ${params.type.replace('_', ' ')} successfully.`,
          variant: 'brand',
        });
        if (onRefreshOutputs) onRefreshOutputs();
      } else {
        toast({
          title: 'Generation Failed',
          description: res.error || 'Could not complete generation.',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Generation error.',
        variant: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
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
        toast({ title: 'Renamed', description: 'Output title updated.', variant: 'brand' });
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
        toast({ title: 'Deleted', description: 'Output removed.', variant: 'neutral' });
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
    toast({ title: 'Regenerating Output', description: 'Running synthesis in background...', variant: 'brand' });
    try {
      const res = await regenerateStudioOutput(outputId);
      if (res.success) {
        toast({ title: 'Regenerated', description: 'Updated with latest sources.', variant: 'brand' });
        if (onRefreshOutputs) onRefreshOutputs();
      } else {
        toast({ title: 'Regenerate Failed', description: res.error, variant: 'error' });
      }
    } catch (err: any) {
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
    toast({ title: 'Exported', description: 'File downloaded.', variant: 'neutral' });
  };

  const handleOpenOutputViewer = (output: StudioOutput) => {
    if (output.type === 'voice') {
      setActiveViewerOutput(output);
    } else {
      setActiveViewerOutput(output);
    }
  };

  const handleListenFromViewer = (textToRead: string) => {
    // Open Voice dialog pre-configured to Narration
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
          Studio Synthesizers
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {studioTiles.map((tile) => (
            <CapabilityGate
              key={tile.id}
              feature={tile.capability}
              modelId={selectedModelId}
              className="w-full h-full"
            >
              <div
                onClick={() => handleTileClick(tile.id)}
                className="group relative p-3 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2c2c2c] cursor-pointer transition-all flex flex-col justify-between min-h-[108px] w-full shadow-sm text-left"
              >
                <div className="flex items-start justify-between w-full">
                  <div className="p-2 rounded-xl bg-[#191919] border border-[#303030] group-hover:scale-105 transition-transform">
                    {tile.icon}
                  </div>
                  <span className="text-[9px] font-display font-medium px-2 py-0.5 rounded-full bg-[#191919] text-[#9a9a94] group-hover:text-[#f4f4f2] border border-[#303030]">
                    {tile.badge}
                  </span>
                </div>

                <div className="mt-2">
                  <h3 className="text-xs font-display font-bold text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                    {tile.title}
                  </h3>
                  <p className="text-[10px] text-[#9a9a94] font-serif line-clamp-2 mt-0.5 leading-snug">
                    {tile.desc}
                  </p>
                </div>
              </div>
            </CapabilityGate>
          ))}
        </div>
      </div>

      {/* Generated Outputs List Section */}
      <div className="pt-2 border-t border-[#303030]">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <p className="text-[11px] uppercase tracking-wider font-display font-bold text-[#9a9a94]">
            Generated Outputs
          </p>
          <span className="text-[10px] text-[#9a9a94] font-mono">
            {outputs.length} {outputs.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {outputs.length === 0 ? (
          <div className="py-8 text-center px-4 rounded-2xl bg-[#262626]/50 border border-dashed border-[#303030]">
            <Sparkles className="w-6 h-6 text-[#9a9a94] mx-auto mb-2 opacity-40" />
            <p className="text-xs font-display font-semibold text-[#f4f4f2]">No outputs generated yet</p>
            <p className="text-[11px] text-[#9a9a94] font-serif mt-1 max-w-[220px] mx-auto leading-relaxed">
              Select any of the 7 studio synthesizers above to create quizzes, flashcards, study guides, or voice-overs.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {outputs.map((out) => {
              const isMenuOpen = openMenuOutputId === out.id;
              const sourceCount = Array.isArray(out.sourceIds) ? out.sourceIds.length : 0;

              return (
                <div
                  key={out.id}
                  className="group relative p-3 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/40 transition-all flex items-start justify-between gap-3 shadow-sm"
                >
                  {/* Left Icon & Title clickable to open viewer */}
                  <div
                    onClick={() => out.status === 'ready' && handleOpenOutputViewer(out)}
                    className={`flex items-start gap-2.5 flex-1 min-w-0 ${
                      out.status === 'ready' ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-[#191919] border border-[#303030] shrink-0 mt-0.5">
                      {getTypeIcon(out.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-display font-bold text-[#f4f4f2] truncate group-hover:text-brand-300 transition-colors">
                          {out.title}
                        </h4>
                        {/* Status Semantic Indicators */}
                        {out.status === 'generating' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Synthesizing
                          </span>
                        )}
                        {out.status === 'failed' && (
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 shrink-0"
                            title={out.errorMessage || 'Failed'}
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            Failed
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-[#9a9a94] font-serif mt-0.5">
                        {sourceCount} {sourceCount === 1 ? 'source' : 'sources'} · {formatRelativeTime(out.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions Dropdown Menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setOpenMenuOutputId(isMenuOpen ? null : out.id)}
                      className="p-1 rounded-lg text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#303030] transition-colors"
                      title="Output actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-[#1a1a1a] border border-[#383838] shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => handleRenameClick(out)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2"
                        >
                          <Pencil className="w-3 h-3 text-[#9a9a94]" />
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateOutput(out.id)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2"
                        >
                          <RotateCcw className="w-3 h-3 text-[#9a9a94]" />
                          Regenerate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportOutput(out)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-[#f4f4f2] hover:bg-[#262626] flex items-center gap-2"
                        >
                          <Download className="w-3 h-3 text-[#9a9a94]" />
                          Export
                        </button>
                        <div className="h-px bg-[#303030] my-1" />
                        <button
                          type="button"
                          onClick={() => handleDeleteOutput(out.id)}
                          className="w-full px-3 py-1.5 text-left text-xs font-display text-rose-400 hover:bg-rose-950/20 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    )}
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
        <Dialog open={Boolean(activeViewerOutput)} onOpenChange={() => setActiveViewerOutput(null)}>
          <div className="w-[92vw] max-w-4xl h-[86vh] bg-[#191919] text-[#f4f4f2] rounded-3xl border border-[#303030] shadow-2xl overflow-hidden flex flex-col">
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
              />
            )}
            {activeViewerOutput.type === 'summary' && (
              <SummaryViewer
                title={activeViewerOutput.title}
                content={activeViewerOutput.content || ''}
                onListen={handleListenFromViewer}
              />
            )}
            {activeViewerOutput.type === 'mind_map' && (
              <MindMapViewer
                content={activeViewerOutput.content || '{}'}
                onOpenSource={(srcId) => {
                  const found = sources.find((s) => s.id === srcId);
                  if (found && onOpenSourceViewer) onOpenSourceViewer(found);
                }}
              />
            )}
            {activeViewerOutput.type === 'report' && (
              <ReportViewer
                title={activeViewerOutput.title}
                content={activeViewerOutput.content || ''}
                onListen={handleListenFromViewer}
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
          </div>
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

