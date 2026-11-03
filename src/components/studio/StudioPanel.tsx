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
  Play,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Headphones,
  FileText,
  FileCode,
  File,
  Printer,
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
import { exportToPdf, exportToMarkdown, exportToTxt, printFormattedDocument } from '@/lib/export/export-helper';
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
      id: 'voice' as const,
      title: t('voice_title'),
      desc: t('voice_desc'),
      icon: <Mic className="w-5 h-5 text-purple-400" />,
      badge: t('badge_audio_overview'),
      capability: 'audioOutput' as const,
    },
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
      id: 'mind_map' as const,
      title: t('mind_map_title'),
      desc: t('mind_map_desc'),
      icon: <GitFork className="w-5 h-5 text-brand-300" />,
      badge: t('badge_graph'),
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
      id: 'report' as const,
      title: t('report_title'),
      desc: t('report_desc'),
      icon: <ScrollText className="w-5 h-5 text-rose-400" />,
      badge: t('badge_citations'),
      capability: 'text' as const,
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

    // 5. Semantic generating toast
    toast({
      title: 'Generating Output',
      description: `${title} is synthesizing in the background with ${activeModelDef.name}...`,
      variant: 'generating',
      duration: 5000,
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
    toast({ title: 'Regenerating Output', description: 'Running synthesis in background...', variant: 'generating', duration: 5000 });
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

  const handleDownloadOutput = (output: StudioOutput, format?: 'pdf' | 'md' | 'txt' | 'print' | 'mp3' | 'json' | 'csv') => {
    setOpenMenuOutputId(null);
    const safeTitle = (output.title || 'Studio Output')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'studio-output';

    try {
      // 1. Voice Output: Native Audio MP3 or clean dialogue transcript
      if (output.type === 'voice') {
        if (format === 'txt' || format === 'md' || (!output.audioKeys?.length && !format)) {
          const script = output.script || [];
          const isUrdu =
            (output.voiceConfig as any)?.language?.toLowerCase().includes('urdu') ||
            (output.voiceConfig as any)?.language === 'ur' ||
            script.some((t) => /[\u0600-\u06FF]/.test(t.text));

          let transcriptText = '';
          if (format === 'md') {
            transcriptText = `# ${output.title}\n\n`;
            transcriptText += `> **Podcast Format:** ${(output.voiceConfig as any)?.format || 'Deep Dive'} · **Language:** ${isUrdu ? 'Urdu (اردو)' : 'English'
              } · **Hosts:** ${(output.voiceConfig as any)?.speaker1Name || 'Alex'} & ${(output.voiceConfig as any)?.speaker2Name || 'Jordan'}\n\n---\n\n`;
            transcriptText += script.map((t) => `### **${t.speaker}**\n\n${t.text}\n`).join('\n');
            exportToMarkdown(`${safeTitle}-transcript.md`, transcriptText);
            toast({ title: 'Downloaded Transcript', description: `${safeTitle}-transcript.md saved.`, variant: 'success' });
          } else {
            transcriptText = `${output.title}\n${'='.repeat(output.title.length)}\n\n`;
            transcriptText += `Format: ${(output.voiceConfig as any)?.format || 'Deep Dive'} | Language: ${isUrdu ? 'Urdu (اردو)' : 'English'
              } | Hosts: ${(output.voiceConfig as any)?.speaker1Name || 'Alex'} & ${(output.voiceConfig as any)?.speaker2Name || 'Jordan'}\n\n`;
            transcriptText += script.map((t) => `[${t.speaker}]:\n${t.text}\n`).join('\n');
            exportToTxt(`${safeTitle}-transcript.txt`, transcriptText);
            toast({ title: 'Downloaded Transcript', description: `${safeTitle}-transcript.txt saved.`, variant: 'success' });
          }
          return;
        }

        // Default: Download Full MP3 Audio File!
        const audioKey = output.audioKeys?.[0];
        if (audioKey) {
          const a = document.createElement('a');
          a.href = `/api/storage/${audioKey}`;
          a.download = `${safeTitle}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast({ title: 'Downloaded Audio', description: `${output.title}.mp3 saved to your device.`, variant: 'success' });
        } else {
          toast({ title: 'Audio Unavailable', description: 'Audio file not generated or using browser voice.', variant: 'warning' });
        }
        return;
      }

      // 2. Quiz Output: Native PDF Worksheet, JSON, or Markdown
      if (output.type === 'quiz') {
        if (format === 'json') {
          const blob = new Blob([output.content || '[]'], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeTitle}-quiz.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: 'Downloaded Quiz Data', description: `${safeTitle}-quiz.json saved.`, variant: 'success' });
          return;
        }
        let parsedQuiz: any[] = [];
        try { parsedQuiz = JSON.parse(output.content || '[]'); } catch { }
        const markdownQuiz = parsedQuiz.length > 0
          ? `# ${output.title}\n\n` + parsedQuiz.map((q, i) => `### Question ${i + 1}: ${q.question}\n\n` + (q.options || []).map((opt: string, oi: number) => `- **${String.fromCharCode(65 + oi)}.** ${opt}`).join('\n') + `\n\n*Answer: Option ${q.correctAnswer}*\n*Explanation: ${q.explanation || ''}*\n`).join('\n---\n\n')
          : output.content || '';

        if (format === 'md') {
          exportToMarkdown(`${safeTitle}-quiz.md`, markdownQuiz);
          toast({ title: 'Downloaded Quiz', description: `${safeTitle}-quiz.md saved.`, variant: 'success' });
        } else {
          exportToPdf({
            filename: `${safeTitle}-quiz.pdf`,
            title: output.title,
            subtitle: 'Interactive Quiz Worksheet',
            content: markdownQuiz,
            metadata: { notebookTitle: notebook.title, type: 'QUIZ' },
          });
          toast({ title: 'Downloaded Quiz PDF', description: `${safeTitle}-quiz.pdf saved.`, variant: 'success' });
        }
        return;
      }

      // 3. Flashcards Output: Native PDF, CSV, or Markdown
      if (output.type === 'flashcards') {
        let cards: any[] = [];
        try { cards = JSON.parse(output.content || '[]'); } catch { }
        if (format === 'csv') {
          const csv = 'Front,Back\n' + cards.map(c => `"${(c.front || '').replace(/"/g, '""')}","${(c.back || '').replace(/"/g, '""')}"`).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeTitle}-flashcards.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({ title: 'Downloaded CSV', description: `${safeTitle}-flashcards.csv saved.`, variant: 'success' });
          return;
        }
        const mdDeck = cards.length > 0
          ? `# ${output.title}\n\n` + cards.map((c, i) => `### Card ${i + 1}\n**Front:** ${c.front}\n\n**Back:** ${c.back}\n`).join('\n---\n\n')
          : output.content || '';
        if (format === 'md') {
          exportToMarkdown(`${safeTitle}-flashcards.md`, mdDeck);
          toast({ title: 'Downloaded Flashcards', description: `${safeTitle}-flashcards.md saved.`, variant: 'success' });
        } else {
          exportToPdf({
            filename: `${safeTitle}-flashcards.pdf`,
            title: output.title,
            subtitle: 'Study Flashcards Deck',
            content: mdDeck,
            metadata: { notebookTitle: notebook.title, type: 'FLASHCARDS' },
          });
          toast({ title: 'Downloaded Flashcards PDF', description: `${safeTitle}-flashcards.pdf saved.`, variant: 'success' });
        }
        return;
      }

      // 4. Mind Map Output: Native Markdown Outline or PDF
      if (output.type === 'mind_map') {
        const textToExport = output.content || '';
        if (format === 'pdf') {
          exportToPdf({
            filename: `${safeTitle}-mindmap.pdf`,
            title: output.title,
            subtitle: 'Mind Map Concept Outline',
            content: textToExport,
            metadata: { notebookTitle: notebook.title, type: 'MIND MAP' },
          });
          toast({ title: 'Downloaded Mind Map PDF', description: `${safeTitle}-mindmap.pdf saved.`, variant: 'success' });
        } else {
          exportToMarkdown(`${safeTitle}-mindmap.md`, textToExport);
          toast({ title: 'Downloaded Mind Map', description: `${safeTitle}-mindmap.md saved.`, variant: 'success' });
        }
        return;
      }

      // 5. Document Outputs: Study Guide, Summary, Report (Native PDF, Markdown, Text, or Print)
      const textToExport = output.content || '';
      if (format === 'md') {
        exportToMarkdown(`${safeTitle}.md`, textToExport);
        toast({ title: 'Downloaded Markdown', description: `${safeTitle}.md saved.`, variant: 'success' });
      } else if (format === 'txt') {
        exportToTxt(`${safeTitle}.txt`, textToExport);
        toast({ title: 'Downloaded Text', description: `${safeTitle}.txt saved.`, variant: 'success' });
      } else if (format === 'print') {
        printFormattedDocument(output.title, textToExport, {
          notebookTitle: notebook.title,
          type: output.type.toUpperCase(),
        });
      } else {
        exportToPdf({
          filename: `${safeTitle}.pdf`,
          title: output.title,
          content: textToExport,
          metadata: {
            notebookTitle: notebook.title,
            type: output.type.toUpperCase(),
          },
        });
        toast({ title: 'Downloaded PDF', description: `${safeTitle}.pdf saved.`, variant: 'success' });
      }
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not download.', variant: 'error' });
    }
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#fbfbfd] text-zinc-900 dark:bg-[#1f1f1f] dark:text-[#f4f4f2] overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-[#303030]">
      {/* 7 Studio Action Tiles */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-display font-bold text-zinc-500 dark:text-[#9a9a94] mb-2.5 px-1">
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
                    className="rounded-2xl bg-zinc-200/80 border border-brand-500/60 shadow-lg shadow-brand-500/15 pointer-events-none dark:bg-[#2a2a2a]"
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
                  className={`group relative z-10 p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[108px] w-full text-left h-full ${isSupported
                    ? 'bg-white border-zinc-200 shadow-xs hover:border-brand-500/50 hover:shadow-md dark:bg-[#262626]/85 dark:border-[#303030] dark:shadow-none cursor-pointer active:scale-[0.99]'
                    : 'bg-zinc-50 border-dashed border-zinc-300 dark:bg-[#181818] dark:border-[#3a3a3a] cursor-not-allowed opacity-45 grayscale-[40%]'
                    }`}
                >
                  <div className="flex items-start justify-between w-full gap-1">
                    <div
                      className={`p-2 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-[#191919] dark:border-[#303030] transition-transform duration-150 shrink-0 ${isSupported ? 'group-hover:scale-105' : 'opacity-60'
                        }`}
                    >
                      {tile.icon}
                    </div>
                    {isSupported ? (
                      <span className="text-[9px] font-display font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 dark:bg-[#191919] dark:text-[#9a9a94] group-hover:text-zinc-900 dark:group-hover:text-[#f4f4f2] border border-zinc-200 dark:border-[#303030] shrink-0">
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
                      className={`text-xs font-display font-bold transition-colors ${isSupported ? 'text-zinc-900 group-hover:text-brand-600 dark:text-[#f4f4f2] dark:group-hover:text-brand-300' : 'text-zinc-400 dark:text-[#7a7a74]'
                        }`}
                    >
                      {tile.title}
                    </h3>
                    {isSupported ? (
                      <p className="text-[10px] text-zinc-500 dark:text-[#9a9a94] font-serif line-clamp-2 mt-0.5 leading-snug">
                        {tile.desc}
                      </p>
                    ) : (
                      <p className="text-[10px] text-rose-500/90 dark:text-rose-400/90 font-serif line-clamp-2 mt-0.5 leading-snug">
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
      <div className="pt-2 border-t border-zinc-200 dark:border-[#303030]">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <p className="text-[11px] uppercase tracking-wider font-display font-bold text-zinc-500 dark:text-[#9a9a94]">
            {t('generated_outputs')}
          </p>
          <span className="text-[10px] text-zinc-500 dark:text-[#9a9a94] font-mono shrink-0">
            {chatOutputs.length} {chatOutputs.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {chatOutputs.length === 0 ? (
          <div className="py-8 text-center px-4 rounded-2xl bg-zinc-100/60 border border-dashed border-zinc-300 dark:bg-[#262626]/50 dark:border-[#303030]">
            <Sparkles className="w-6 h-6 text-zinc-400 dark:text-[#9a9a94] mx-auto mb-2 opacity-50" />
            <p className="text-xs font-display font-semibold text-zinc-900 dark:text-[#f4f4f2]">{t('no_outputs_yet')}</p>
            <p className="text-[11px] text-zinc-500 dark:text-[#9a9a94] font-serif mt-1 max-w-[220px] mx-auto leading-relaxed">
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
                    className="rounded-2xl bg-zinc-200/80 border border-brand-500/50 shadow-md shadow-brand-500/10 pointer-events-none dark:bg-[#2a2a2a]"
                  />

                  <div
                    className={`group relative ${isMenuOpen ? 'z-40' : 'z-10'} p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 shadow-xs ${isGeneratingItem
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-amber-500/5'
                      : isFailedItem
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-white border-zinc-200 shadow-xs hover:border-brand-500/40 hover:shadow-md dark:bg-[#262626]/85 dark:border-[#303030] dark:shadow-none'
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
                            variant: 'generating',
                          });
                        }
                      }}
                      className={`flex items-start gap-2.5 flex-1 min-w-0 ${isReadyItem ? 'cursor-pointer' : isGeneratingItem ? 'cursor-wait' : 'cursor-default'
                        }`}
                    >
                      <div
                        className={`p-2 rounded-xl shrink-0 mt-0.5 border ${isGeneratingItem
                          ? 'bg-amber-500/15 border-amber-500/30'
                          : isFailedItem
                            ? 'bg-rose-500/15 border-rose-500/30'
                            : 'bg-zinc-100 border-zinc-200 dark:bg-[#191919] dark:border-[#303030]'
                          }`}
                      >
                        {isGeneratingItem ? (
                          <Loader2 className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin" />
                        ) : (
                          getTypeIcon(out.type)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className={`text-xs font-display font-bold truncate transition-colors ${isReadyItem
                              ? 'text-zinc-900 group-hover:text-brand-600 dark:text-[#f4f4f2] dark:group-hover:text-brand-300'
                              : isGeneratingItem
                                ? 'text-amber-700 dark:text-amber-200'
                                : 'text-rose-700 dark:text-rose-200'
                              }`}
                          >
                            {out.title}
                          </h4>

                          {/* Semantic Status Badges */}
                          {isFailedItem && (
                            <span
                              className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0"
                              title={out.errorMessage || 'Failed'}
                            >
                              <AlertCircle className="w-2.5 h-2.5" />
                              Failed
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-500 dark:text-[#9a9a94] font-serif mt-0.5 truncate">
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
                            <span className="text-rose-500 dark:text-rose-400/90 font-medium truncate block">
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
                          className="px-2 py-1 rounded-lg text-[10px] font-display font-medium bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Retry generation"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </button>
                      )}

                      {isReadyItem && (
                        <Tooltip content={out.type === 'voice' ? 'Play audio overview' : 'Open output'}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOutputViewer(out);
                            }}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#9a9a94] dark:hover:text-[#f4f4f2] dark:hover:bg-[#303030] transition-colors cursor-pointer"
                            aria-label={out.type === 'voice' ? 'Play audio overview' : 'Open output'}
                          >
                            {out.type === 'voice' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <ExternalLink className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </Tooltip>
                      )}

                      <Tooltip content="Output actions">
                        <button
                          type="button"
                          onClick={() => setOpenMenuOutputId(isMenuOpen ? null : out.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-[#9a9a94] dark:hover:text-[#f4f4f2] dark:hover:bg-[#303030] transition-colors cursor-pointer"
                          aria-label="Output actions"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenMenuOutputId(null)}
                          />
                          <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-white border border-zinc-200 text-zinc-900 shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 origin-bottom-right duration-100 dark:bg-[#1a1a1a] dark:border-[#383838] dark:text-[#f4f4f2]">
                            {isReadyItem && (
                              <button
                                type="button"
                                onClick={() => handleRenameClick(out)}
                                className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3 text-zinc-400 dark:text-[#9a9a94]" />
                                Rename
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRegenerateOutput(out.id)}
                              className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3 text-zinc-400 dark:text-[#9a9a94]" />
                              Regenerate
                            </button>
                            {isReadyItem && out.type === 'voice' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'mp3')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <Headphones className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                                  Download Audio (.mp3)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'txt')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                                  Download Transcript (.txt)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'md')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                  Download Markdown (.md)
                                </button>
                              </>
                            )}
                            {isReadyItem && out.type === 'quiz' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'pdf')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                                  Download Worksheet (.pdf)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'json')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCode className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                  Download Quiz Data (.json)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'md')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                  Download Markdown (.md)
                                </button>
                              </>
                            )}
                            {isReadyItem && out.type === 'flashcards' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'pdf')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                                  Download Flashcards (.pdf)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'csv')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <File className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                  Download Cards (.csv)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'md')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                  Download Markdown (.md)
                                </button>
                              </>
                            )}
                            {isReadyItem && out.type !== 'voice' && out.type !== 'quiz' && out.type !== 'flashcards' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'pdf')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                                  Download PDF (.pdf)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'md')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <FileCode className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                  Download Markdown (.md)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'txt')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <File className="w-3 h-3 text-zinc-400" />
                                  Download Text (.txt)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadOutput(out, 'print')}
                                  className="w-full px-3 py-1.5 text-left text-xs font-display text-zinc-800 hover:bg-zinc-100 dark:text-[#f4f4f2] dark:hover:bg-[#262626] flex items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                  Print / Save as PDF
                                </button>
                              </>
                            )}
                            <div className="h-px bg-zinc-200 dark:bg-[#303030] my-1" />
                            <button
                              type="button"
                              onClick={() => handleDeleteOutput(out.id)}
                              className="w-full px-3 py-1.5 text-left text-xs font-display text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </>
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
          <div className="p-6 max-w-sm w-full bg-white text-zinc-900 rounded-3xl border border-zinc-200 shadow-2xl dark:bg-[#1f1f1f] dark:text-[#f4f4f2] dark:border-[#303030]">
            <h3 className="font-display font-bold text-base text-zinc-900 dark:text-[#f4f4f2] mb-3">
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
          className="w-[95vw] max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[88vh] max-h-[90vh] p-0 border-zinc-200 bg-white text-zinc-900 dark:border-[#303030] dark:bg-[#191919] dark:text-[#f4f4f2] overflow-hidden rounded-3xl shadow-2xl flex flex-col"
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
