'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Plus,
  Search,
  Check,
  CheckSquare,
  Square,
  RefreshCw,
  Trash2,
  Pencil,
  FileText,
  Globe,
  Upload,
  Sparkles,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftOpen,
  Layers,
  HelpCircle,
  Brain,
  AlignLeft,
  GitFork,
  ScrollText,
  ArrowUp,
  Mic,
  Paperclip,
  Key,
  ChevronDown,
  Lock,
  AlertTriangle,
  Activity,
  Zap,
  X,
} from 'lucide-react';
import { Button, Input, Textarea, Badge, Dialog, Tooltip, GlidingHighlight } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { Notebook, Source, Note, Conversation, Message, Citation, StudioOutput } from '@/db/schema';
import { STORAGE_LIMITS } from '@/config/limits';
import { StudioPanel } from '@/components/studio/StudioPanel';
import {
  updateNotebook,
  createNote,
  updateNote,
  deleteNote,
} from '@/app/app/notebook-actions';
import { ModelSwitcher } from '@/components/ai/ModelSwitcher';
import { CapabilityGate } from '@/components/ai/CapabilityGate';
import { MessageContent as MessageMarkdown } from '@/components/chat/MessageContent';
import { getModelDefinition } from '@/lib/ai/providers';
import {
  Message as AIMessage,
  MessageContent as AIMessageContent,
  MessageActions as AIMessageActions,
  MessageAction as AIMessageAction,
  Sources as AISources,
  SourcesTrigger as AISourcesTrigger,
  SourcesContent as AISourcesContent,
  Source as AISourceItem,
  Reasoning as AIReasoning,
  ReasoningTrigger as AIReasoningTrigger,
  ReasoningContent as AIReasoningContent,
  Suggestions as AISuggestions,
  Suggestion as AISuggestion,
  PromptInput as AIPromptInput,
  PromptInputTextarea as AIPromptInputTextarea,
  PromptInputTools as AIPromptInputTools,
  Shimmer as AIShimmer,
} from '@/components/ai-elements';
import { SafeApiKey } from '@/app/app/api-key-actions';
import {
  Copy,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  RotateCcw,
  MessageSquare,
  GraduationCap,
  Square as StopSquare,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'Just now';
  const now = Date.now();
  const then = new Date(date).getTime();
  if (isNaN(then)) return 'Just now';
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
}

interface WorkspaceThreePanelViewProps {
  notebook: Notebook;
  sources: Source[];
  notes: Note[];
  onOpenAddSource: () => void;
  onOpenSourceViewer: (source: Source) => void;
  onToggleSourceEnabled: (sourceId: string, enabled: boolean) => Promise<void>;
  onRenameSource: (source: Source, newTitle: string) => Promise<void>;
  onDeleteSource: (sourceId: string) => Promise<void>;
  onRetrySource: (sourceId: string) => Promise<void>;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;

  // Phase 3 additions:
  userKeys?: SafeApiKey[];
  onOpenManageKeys?: () => void;
  conversations?: Conversation[];
  activeConversationId?: string | null;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (id: string) => void;
  onRenameConversation?: (id: string, newTitle: string) => Promise<void>;
  messages?: Message[];
  onSendMessage?: (content: string, modelId: string, mode: 'chat' | 'learn' | 'quiz') => Promise<void>;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingCitations?: Citation[];
  onStopStreaming?: () => void;
  onSaveNoteFromMessage?: (content: string, title?: string) => Promise<void>;
  onCitationClick?: (citation: Citation) => void;
  onDeleteMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onResendMessage?: (messageId: string, promptContent?: string) => void;
  selectedModelId?: string;
  onSelectModelId?: (modelId: string) => void;
  selectedMode?: 'chat' | 'learn' | 'quiz';
  onSelectMode?: (mode: 'chat' | 'learn' | 'quiz') => void;
  outputs?: StudioOutput[];
  onRefreshOutputs?: () => void;
  isLoadingMessages?: boolean;
  onEnsureConversation?: (title?: string) => Promise<string>;
}


// ---------------------------------------------------------------------------
// Isolated Subcomponents with local hover state (prevents full-workspace re-render)
// ---------------------------------------------------------------------------
const RightPanelTabSwitcher = React.memo(function RightPanelTabSwitcher({
  studioTab,
  setStudioTab,
  sourcesCount,
  enabledCount,
}: {
  studioTab: 'context' | 'studio';
  setStudioTab: (tab: 'context' | 'studio') => void;
  sourcesCount: number;
  enabledCount: number;
}) {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const { t } = useLanguage();

  return (
    <div
      onMouseLeave={() => setHoveredTab(null)}
      className="relative flex items-center bg-[#191919] p-0.5 rounded-xl border border-[#303030]"
    >
      <Tooltip content="Notebook instructions, memory & sources" side="bottom">
        <div
          className="relative"
          onMouseEnter={() => setHoveredTab('context')}
        >
          <GlidingHighlight
            activeId={studioTab}
            hoverId={hoveredTab}
            itemId="context"
            layoutId="right-panel-tab"
            className={studioTab === 'context' ? 'bg-[#262626] border border-[#383838]' : 'bg-[#222222]'}
          />
          <button
            onClick={() => setStudioTab('context')}
            className={`relative z-10 px-3 py-1.5 text-xs font-display font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              studioTab === 'context' ? 'text-[#f4f4f2]' : 'text-[#9a9a94] hover:text-[#f4f4f2]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>{t('context')}</span>
            {sourcesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-brand-500/20 text-brand-300 font-mono">
                {enabledCount}
              </span>
            )}
          </button>
        </div>
      </Tooltip>

      <Tooltip content="Synthesizers: Quiz, Flashcards, Voice overview & more" side="bottom">
        <div
          className="relative"
          onMouseEnter={() => setHoveredTab('studio')}
        >
          <GlidingHighlight
            activeId={studioTab}
            hoverId={hoveredTab}
            itemId="studio"
            layoutId="right-panel-tab"
            className={studioTab === 'studio' ? 'bg-[#262626] border border-[#383838]' : 'bg-[#222222]'}
          />
          <button
            onClick={() => setStudioTab('studio')}
            className={`relative z-10 px-3 py-1.5 text-xs font-display font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              studioTab === 'studio' ? 'text-[#f4f4f2]' : 'text-[#9a9a94] hover:text-[#f4f4f2]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>{t('studio')}</span>
          </button>
        </div>
      </Tooltip>
    </div>
  );
});

const ModeDropdownSwitcher = React.memo(function ModeDropdownSwitcher({
  selectedMode = 'chat',
  onSelectMode,
  selectedModelId,
}: {
  selectedMode?: 'chat' | 'learn' | 'quiz';
  onSelectMode?: (mode: 'chat' | 'learn' | 'quiz') => void;
  selectedModelId: string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const activeModelDef = React.useMemo(() => getModelDefinition(selectedModelId), [selectedModelId]);
  const supportsStructuredOutput = activeModelDef?.capabilities?.structuredOutput ?? true;
  const { t } = useLanguage();

  const modes: Array<{
    id: 'chat' | 'learn' | 'quiz';
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    disabled?: boolean;
    disabledReason?: string;
  }> = [
    {
      id: 'chat',
      label: t('chat'),
      description: t('mode_chat_desc'),
      icon: MessageSquare,
    },
    {
      id: 'learn',
      label: t('learn'),
      description: t('mode_learn_desc'),
      icon: GraduationCap,
    },
    {
      id: 'quiz',
      label: t('quiz'),
      description: t('mode_quiz_desc'),
      icon: HelpCircle,
      disabled: !supportsStructuredOutput,
      disabledReason: 'Requires structured output',
    },
  ];

  const currentModeObj = modes.find((m) => m.id === selectedMode) || modes[0];
  const CurrentIcon = currentModeObj.icon;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Mode Trigger Button */}
      <Tooltip content="Change assistant mode">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-medium text-[#f4f4f2] bg-[#262626] hover:bg-[#303030] border border-[#3a3a3a] transition-all cursor-pointer shadow-sm"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <CurrentIcon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="text-[#9a9a94] text-[11px] hidden xs:inline">{t('mode')}:</span>
          <span className="capitalize font-semibold text-[#f4f4f2]">{currentModeObj.label}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#9a9a94] transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </Tooltip>

      {/* Mode Dropdown Popover */}
      {dropdownOpen && (
        <div
          className="absolute left-0 bottom-full mb-2 w-64 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl p-2 z-50 text-xs text-[#f4f4f2] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
          onMouseLeave={() => setHoveredMode(null)}
        >
          <div className="px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
            Select Mode
          </div>

          <div className="space-y-1 my-1">
            {modes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              const Icon = mode.icon;

              return (
                <div
                  key={mode.id}
                  className="relative"
                  onMouseEnter={() => !mode.disabled && setHoveredMode(mode.id)}
                >
                  <GlidingHighlight
                    activeId={isSelected ? mode.id : null}
                    hoverId={hoveredMode}
                    itemId={mode.id}
                    layoutId="mode-dropdown-glide"
                    className={
                      isSelected
                        ? 'bg-brand-500/20 border border-brand-500/40'
                        : 'bg-[#262626] border border-[#383838]'
                    }
                  />
                  <button
                    type="button"
                    disabled={mode.disabled}
                    onClick={() => {
                      if (!mode.disabled) {
                        onSelectMode?.(mode.id);
                        setDropdownOpen(false);
                      }
                    }}
                    className={`relative z-10 w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-brand-300 font-semibold'
                        : mode.disabled
                        ? 'opacity-40 cursor-not-allowed text-[#9a9a94]'
                        : 'text-[#f4f4f2]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-brand-500/25 text-brand-300'
                            : 'bg-[#191919] text-[#9a9a94]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-medium text-xs">
                            {mode.label}
                          </span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-brand-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[#9a9a94] truncate">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                    {mode.disabled && (
                      <span className="text-[9px] text-amber-400/90 font-mono shrink-0 ml-1">
                        Unsupported
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export function WorkspaceThreePanelView({
  notebook,
  sources,
  notes,
  onOpenAddSource,
  onOpenSourceViewer,
  onToggleSourceEnabled,
  onRenameSource,
  onDeleteSource,
  onRetrySource,
  hasApiKey,
  onOpenSettings,
  sidebarOpen = true,
  onToggleSidebar,
  userKeys = [],
  onOpenManageKeys,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  messages = [],
  isLoadingMessages = false,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onResendMessage,
  isStreaming = false,
  streamingContent = '',
  streamingCitations = [],
  onStopStreaming,
  onSaveNoteFromMessage,
  onCitationClick,
  selectedModelId = 'gemini-3.8-flash',
  onSelectModelId,
  selectedMode = 'chat',
  onSelectMode,
  outputs = [],
  onRefreshOutputs,
  onEnsureConversation,
}: WorkspaceThreePanelViewProps) {
  const { toast } = useToast();
  const { language, t } = useLanguage();

  // Desktop Right Sidebar Open/Close
  const [studioPanelOpen, setStudioPanelOpen] = useState(true);

  // Tablet Drawer Open/Close
  const [tabletDrawerOpen, setTabletDrawerOpen] = useState(false);

  // Mobile Bottom Tab: 'chat' | 'context' | 'studio'
  const [mobileTab, setMobileTab] = useState<'chat' | 'context' | 'studio'>('chat');

  // Studio Right Sidebar Active Tab: 'context' (Claude card) | 'studio' (Synthesize)
  const [studioTab, setStudioTab] = useState<'context' | 'studio'>('studio');

  // Active conversation resolved for all subpanels
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Subheader Chat Title Editing State
  const [isEditingChatTitle, setIsEditingChatTitle] = useState(false);
  const [currentChatTitleDraft, setCurrentChatTitleDraft] = useState('');

  // Sync draft title when activeConversation changes
  React.useEffect(() => {
    if (activeConversation) {
      setCurrentChatTitleDraft(activeConversation.title);
    }
  }, [activeConversation?.id, activeConversation?.title]);

  const handleSaveChatTitle = async () => {
    const trimmed = currentChatTitleDraft.trim();
    if (trimmed && activeConversation && onRenameConversation && trimmed !== activeConversation.title) {
      await onRenameConversation(activeConversation.id, trimmed);
    }
    setIsEditingChatTitle(false);
  };

  // Context Window & Token Calculations
  const activeModelDef = React.useMemo(() => getModelDefinition(selectedModelId), [selectedModelId]);
  const contextWindowLimit = activeModelDef?.capabilities?.contextWindow || 1048576;

  const sourcesTokens = React.useMemo(() => {
    return sources
      .filter((s) => s.enabled)
      .reduce((acc, s) => acc + Math.round((s.wordCount || 0) * 1.33), 0);
  }, [sources]);

  const chatTokens = React.useMemo(() => {
    return messages.reduce((acc, m) => acc + Math.round((m.content?.length || 0) / 4), 0);
  }, [messages]);

  const chatNotes = React.useMemo(() => {
    if (!activeConversationId) return [];
    return notes.filter((n) => n.conversationId === activeConversationId);
  }, [notes, activeConversationId]);

  const memoryTokens = React.useMemo(() => {
    return chatNotes.reduce((acc, n) => acc + Math.round(((n.title?.length || 0) + (n.content?.length || 0)) / 4), 0);
  }, [chatNotes]);

  const totalUsedTokens = sourcesTokens + chatTokens + memoryTokens;
  const usedPercentage = Math.min(100, (totalUsedTokens / contextWindowLimit) * 100);

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1_000_000) {
      return (tokens / 1_000_000).toFixed(1) + 'M';
    }
    if (tokens >= 1_000) {
      return (tokens / 1_000).toFixed(tokens >= 10_000 ? 0 : 1) + 'k';
    }
    return tokens.toString();
  };

  // Instructions Edit Modal
  const [editInstructionsOpen, setEditInstructionsOpen] = useState(false);
  const [instructionsText, setInstructionsText] = useState(
    notebook.instructions ||
      'ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.'
  );
  const [savingInstructions, setSavingInstructions] = useState(false);

  // Keep instructions strictly synchronized across all chats of the notebook
  React.useEffect(() => {
    if (notebook?.instructions !== undefined) {
      setInstructionsText(
        notebook.instructions ||
          'ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.'
      );
    }
  }, [notebook?.instructions]);

  // Read-Only Memory Modal
  const [viewMemoryOpen, setViewMemoryOpen] = useState(false);

  // Source Rename Modal
  const [renamingSource, setRenamingSource] = useState<Source | null>(null);
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [savingRename, setSavingRename] = useState(false);

  // Source Delete Confirm Modal
  const [deletingSource, setDeletingSource] = useState<Source | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chat Input & Feedback State
  const [chatPrompt, setChatPrompt] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to latest turn (pinned to bottom)
  const scrollToBottom = React.useCallback((smooth = true) => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  React.useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      scrollToBottom(true);
    }
  }, [messages.length, isStreaming, streamingContent, scrollToBottom]);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    toast({ title: 'Copied to clipboard', variant: 'success' });
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedbackMap((prev) => ({
      ...prev,
      [id]: prev[id] === type ? (undefined as any) : type,
    }));
    toast({
      title: type === 'up' ? 'Helpful Response' : 'Feedback Recorded',
      description: type === 'up' ? 'Marked as helpful.' : 'Marked as unhelpful.',
      variant: 'neutral',
    });
  };

  const handleSendAction = (textToSend?: string) => {
    const text = (textToSend || chatPrompt).trim();
    if (!text || isStreaming) return;
    setChatPrompt('');
    onSendMessage?.(text, selectedModelId, selectedMode);
    setTimeout(() => scrollToBottom(true), 30);
  };

  // Studio Action Modal
  const [selectedStudioAction, setSelectedStudioAction] = useState<{
    id: string;
    title: string;
    desc: string;
  } | null>(null);

  const enabledCount = sources.filter((s) => s.enabled).length;

  // Handle Save Instructions
  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      await updateNotebook(notebook.id, { instructions: instructionsText.trim() });
      setEditInstructionsOpen(false);
      toast({
        title: 'Instructions Saved',
        description: 'Notebook study instructions updated.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Error saving instructions', description: err.message, variant: 'error' });
    } finally {
      setSavingInstructions(false);
    }
  };



  const handleConfirmRename = async () => {
    if (!renamingSource || !newSourceTitle.trim()) return;
    setSavingRename(true);
    try {
      await onRenameSource(renamingSource, newSourceTitle.trim());
      setRenamingSource(null);
      toast({ title: 'Source Renamed', description: newSourceTitle.trim(), variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Rename failed', description: err.message, variant: 'error' });
    } finally {
      setSavingRename(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingSource) return;
    setIsDeleting(true);
    try {
      await onDeleteSource(deletingSource.id);
      setDeletingSource(null);
      toast({ title: 'Source Deleted', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <span className="text-red-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/50">
            PDF
          </span>
        );
      case 'docx':
        return (
          <span className="text-blue-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-800/50">
            DOC
          </span>
        );
      case 'url':
        return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
      case 'text':
        return <FileText className="w-3.5 h-3.5 text-brand-400" />;
      case 'md':
      default:
        return <FileText className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  // ----------------------------------------------------
  // RIGHT SIDEBAR CONTENT (Claude Card + Studio Tools)
  // Background: #1f1f1f (Claude Surface), Borders: #303030
  // ----------------------------------------------------
  const renderRightSidebarContent = (isMobileOrTablet = false) => {
    const studioTools = [
      {
        id: 'quiz',
        title: 'Quiz',
        desc: 'Multiple choice & conceptual knowledge check questions.',
        icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
        badge: 'Interactive',
      },
      {
        id: 'flashcards',
        title: 'Flashcards',
        desc: 'Key definitions, terms, and active recall cards.',
        icon: <Layers className="w-5 h-5 text-brand-400" />,
        badge: 'Spaced Recall',
      },
      {
        id: 'study-guide',
        title: 'Study Guide',
        desc: 'Comprehensive structured curriculum with key takeaways.',
        icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
        badge: 'Curriculum',
      },
      {
        id: 'summary',
        title: 'Summary',
        desc: 'Executive multi-source synthesis and core thesis.',
        icon: <AlignLeft className="w-5 h-5 text-cyan-400" />,
        badge: 'Synthesis',
      },
      {
        id: 'mind-map',
        title: 'Mind Map',
        desc: 'Hierarchical concept graph connecting source themes.',
        icon: <GitFork className="w-5 h-5 text-brand-300" />,
        badge: 'Graph',
      },
      {
        id: 'report',
        title: 'Report',
        desc: 'Formal academic briefing with grounded inline citations.',
        icon: <ScrollText className="w-5 h-5 text-rose-400" />,
        badge: 'Citations',
      },
    ];

    return (
      <div className="flex flex-col h-full bg-[#1f1f1f] border-l border-[#303030] text-[#f4f4f2] min-h-0 overflow-hidden" data-lenis-prevent>
        {/* Header with Segmented Tab Control: Matches h-14 border-b border-[#303030] across all 3 panels */}
        <div className="h-14 px-3.5 border-b border-[#303030] flex items-center justify-between gap-2 bg-[#1f1f1f]/95 backdrop-blur-sm shrink-0">
          <RightPanelTabSwitcher
            studioTab={studioTab}
            setStudioTab={setStudioTab}
            sourcesCount={sources.length}
            enabledCount={enabledCount}
          />

          <div className="flex items-center gap-1">
            {!isMobileOrTablet && (
              <Tooltip content="Collapse right panel" side="bottom">
                <button
                  onClick={() => setStudioPanelOpen(false)}
                  className="p-1.5 text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                >
                <PanelRightClose className="w-4 h-4" />
                </button>
              </Tooltip>
            )}
            {isMobileOrTablet && (
              <button
                onClick={() => setTabletDrawerOpen(false)}
                className="p-1.5 text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Image 2 Card (Instructions, Memory, Context) */}
        {studioTab === 'context' && (
          <div
            className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#303030] overscroll-contain"
            data-lenis-prevent
          >
            {/* The Unified Claude Card from Image 2 */}
            <div className="rounded-2xl border border-[#303030] bg-[#262626] overflow-hidden shadow-lg">
              {/* 1. Instructions Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-display font-bold text-[#f4f4f2]">{t('instructions')}</span>
                  <Tooltip content={t('edit_instructions')} side="top">
                    <button
                      onClick={() => setEditInstructionsOpen(true)}
                      className="p-1.5 rounded-lg text-[#9a9a94] hover:text-brand-400 hover:bg-[#191919] transition-colors cursor-pointer"
                    >
                    <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
                <p className="text-xs text-[#9a9a94] font-serif leading-relaxed line-clamp-3">
                  {instructionsText ||
                    'ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources...'}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[#303030]" />

              {/* 2. Memory Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-[#f4f4f2]">{t('memory')}</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#191919] text-[#9a9a94] text-[10px] border border-[#303030]">
                      <Lock className="w-2.5 h-2.5" />
                      <span>{t('only_you')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewMemoryOpen(true)}
                    className="text-xs font-display font-semibold text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                  >
                    {t('view_memory')}
                  </button>
                </div>
                <p className="text-xs text-[#9a9a94] font-serif leading-relaxed">
                  {t('memory_desc')}
                </p>

                {chatNotes.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {chatNotes.slice(0, 2).map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setViewMemoryOpen(true)}
                        className="text-[11.5px] p-2.5 rounded-xl bg-[#191919] border border-[#303030] text-[#9a9a94] truncate cursor-pointer hover:border-brand-500/40 hover:text-[#f4f4f2] transition"
                      >
                        <span className="font-semibold text-[#f4f4f2] mr-1.5">{note.title}:</span>
                        {note.content}
                      </div>
                    ))}
                    {chatNotes.length > 2 && (
                      <button
                        onClick={() => setViewMemoryOpen(true)}
                        className="text-[11px] font-display text-brand-400 hover:underline pt-0.5"
                      >
                        +{chatNotes.length - 2} more notes
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[#303030]" />

              {/* 3. Context / Sources Section */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-[#f4f4f2]">{t('context')}</span>
                    {sources.length > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#191919] text-[#9a9a94] border border-[#303030]">
                        {enabledCount}/{sources.length} {t('active')}
                      </span>
                    )}
                  </div>
                  <Tooltip content={t('attach_source')} side="top">
                    <button
                      onClick={onOpenAddSource}
                      className="w-6 h-6 rounded-lg bg-[#191919] text-brand-400 hover:bg-brand-600 hover:text-white border border-[#303030] flex items-center justify-center transition cursor-pointer shadow-sm"
                    >
                    <Plus className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>

                {/* Real Sources List or Exact Image 2 Empty Card */}
                {sources.length === 0 ? (
                  <div
                    onClick={onOpenAddSource}
                    className="rounded-xl bg-[#191919] border border-[#303030] p-6 text-center cursor-pointer hover:border-brand-500/50 hover:bg-[#191919]/80 transition group shadow-inner"
                  >
                    {/* Overlapping Document Icons exactly as in Image 2 */}
                    <div className="relative w-24 h-16 mx-auto mb-3 flex items-center justify-center">
                      {/* Left document card */}
                      <div className="absolute left-1 bottom-1 w-11 h-12 rounded-lg bg-[#262626] border border-[#3a3a3a] p-1.5 flex flex-col gap-1 opacity-70">
                        <div className="w-full h-1 rounded bg-[#52525b]" />
                        <div className="w-4/5 h-1 rounded bg-[#52525b]" />
                        <div className="w-2/3 h-1 rounded bg-[#52525b]" />
                      </div>
                      {/* Right background dashed doc card */}
                      <div className="absolute right-1 bottom-2 w-11 h-12 rounded-lg bg-[#262626] border border-dashed border-[#3a3a3a] opacity-40" />
                      {/* Center foreground doc card with + */}
                      <div className="absolute left-6 top-0 w-12 h-14 rounded-lg bg-[#1f1f1f] border border-brand-500/50 p-2 flex flex-col justify-between shadow-xl group-hover:scale-105 transition-transform">
                        <div className="space-y-1">
                          <div className="w-full h-1 rounded bg-[#71717a]" />
                          <div className="w-3/4 h-1 rounded bg-[#71717a]" />
                        </div>
                        <div className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/60 flex items-center justify-center mx-auto text-brand-400">
                          <Plus className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#9a9a94] font-serif leading-relaxed max-w-[210px] mx-auto">
                      {t('add_source_empty')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className={`group flex items-center gap-2 p-2 rounded-xl text-xs border transition-all ${
                          source.enabled
                            ? 'bg-[#191919] border-[#303030] hover:bg-[#1f1f1f] text-[#f4f4f2]'
                            : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-[#191919]/40 text-[#9a9a94]'
                        }`}
                      >
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => onToggleSourceEnabled(source.id, !source.enabled)}
                          className="text-[#9a9a94] hover:text-brand-400 transition-colors flex-shrink-0 cursor-pointer"
                        >
                          {source.enabled ? (
                            <CheckSquare className="w-4 h-4 text-brand-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        {/* Icon */}
                        <div className="flex-shrink-0">{getSourceIcon(source.type)}</div>

                        {/* Title and details */}
                        <div
                          onClick={() => onOpenSourceViewer(source)}
                          className="flex-1 min-w-0 cursor-pointer"
                          title={`${source.title} (${source.wordCount || 0} words)`}
                        >
                          <p className="truncate font-display font-medium text-xs text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                            {source.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#9a9a94]">
                            <span>{source.wordCount?.toLocaleString() || 0} {t('words')}</span>
                            {source.status === 'processing' && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                {t('processing')}...
                              </span>
                            )}
                            {source.status === 'failed' && (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                {t('error')}
                              </span>
                            )}
                            {source.status === 'ready' && (
                              <span className="text-emerald-400 font-medium">{t('ready')}</span>
                            )}
                          </div>
                        </div>

                        {/* Hover actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {source.status === 'failed' && (
                            <button
                              onClick={() => onRetrySource(source.id)}
                              className="p-1 hover:text-amber-400 transition-colors text-[#9a9a94] cursor-pointer"
                              title="Retry ingestion"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRenamingSource(source);
                              setNewSourceTitle(source.title);
                            }}
                            className="p-1 hover:text-[#f4f4f2] transition-colors text-[#9a9a94] cursor-pointer"
                            title="Rename"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSource(source)}
                            className="p-1 hover:text-red-400 transition-colors text-[#9a9a94] cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onOpenAddSource}
                      className="w-full mt-2 text-xs border-[#303030] text-brand-400 hover:text-brand-300 hover:bg-[#191919]"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      {t('add_source')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Studio Study Synthesis Tools (Phase 4 Studio Panel) */}
        {studioTab === 'studio' && (
          <StudioPanel
            notebook={notebook}
            sources={sources}
            outputs={outputs}
            onRefreshOutputs={onRefreshOutputs}
            selectedModelId={selectedModelId}
            userKeys={userKeys}
            onOpenSourceViewer={onOpenSourceViewer}
            activeConversationId={activeConversationId}
            activeConversationTitle={activeConversation?.title}
            onEnsureConversation={onEnsureConversation}
          />
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // CENTRE PANEL: CHAT AREA (Claude Warm Charcoal #191919)
  // ----------------------------------------------------

  const renderCentreContent = () => (
    <div className="flex flex-col h-full w-full min-w-0 bg-[#191919] relative overflow-hidden text-[#f4f4f2]">
      {/* Workspace Subheader Nav: Matches h-14 border-b border-[#303030] across all 3 panels */}
      <div className="h-14 border-b border-[#303030] px-6 flex items-center justify-between bg-[#191919]/90 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          {/* Re-open Left Sidebar button if closed */}
          {!sidebarOpen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-[#303030] transition-colors cursor-pointer mr-1"
              title="Expand notebook sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-brand-400" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {/* Active Chat Title with Inline Click-to-Rename */}
            {isEditingChatTitle ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveChatTitle();
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={currentChatTitleDraft}
                  onChange={(e) => setCurrentChatTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingChatTitle(false);
                      setCurrentChatTitleDraft(activeConversation?.title || '');
                    }
                  }}
                  autoFocus
                  className="bg-[#141414] border border-brand-500/50 rounded-lg px-2.5 py-1 text-sm text-[#f4f4f2] outline-none font-serif min-w-[160px] max-w-[280px] focus:ring-1 focus:ring-brand-500/50"
                />
                <button
                  type="submit"
                  className="p-1 rounded-md text-brand-400 hover:text-brand-300 hover:bg-[#262626] transition cursor-pointer"
                  title="Save title"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingChatTitle(false);
                    setCurrentChatTitleDraft(activeConversation?.title || '');
                  }}
                  className="p-1 rounded-md text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] transition cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (activeConversation) {
                    setCurrentChatTitleDraft(activeConversation.title);
                    setIsEditingChatTitle(true);
                  }
                }}
                className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-[#262626] text-[#f4f4f2] transition-colors cursor-pointer text-left border border-transparent hover:border-[#383838]"
                title={activeConversation ? 'Click to rename this chat' : undefined}
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-sm font-serif italic truncate max-w-[200px] sm:max-w-[280px] font-medium">
                  {activeConversation?.title || (activeConversationId ? 'Chat' : notebook.title)}
                </span>
                {activeConversation && onRenameConversation && (
                  <Pencil className="w-3 h-3 text-[#9a9a94] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar Trigger & Context Window Meter */}
        <div className="flex items-center gap-2">
          {/* Context Window Limit Meter (Image 2 Green Box) */}
          <Tooltip
            content={
              <div className="p-1 space-y-1.5 text-left min-w-[220px]">
                <div className="flex items-center justify-between border-b border-[#303030] pb-1">
                  <span className="font-display font-bold text-xs text-[#f4f4f2]">Context Window</span>
                  <span className="text-[10px] text-brand-300 font-mono font-semibold">
                    {activeModelDef.name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#9a9a94]">
                  <span>Total Used:</span>
                  <span className="font-mono text-[#f4f4f2] font-semibold">
                    {totalUsedTokens.toLocaleString()} / {contextWindowLimit.toLocaleString()} ({usedPercentage < 0.1 && totalUsedTokens > 0 ? '<0.1' : usedPercentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#303030] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      usedPercentage > 85 ? 'bg-rose-500' : usedPercentage > 65 ? 'bg-amber-400' : 'bg-brand-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, usedPercentage))}%` }}
                  />
                </div>
                <div className="pt-1 border-t border-[#303030] space-y-1 text-[10.5px]">
                  <div className="flex items-center justify-between text-[#9a9a94]">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-brand-400" /> Sources ({enabledCount} active)
                    </span>
                    <span className="font-mono text-[#f4f4f2]">{sourcesTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9a9a94]">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3 text-cyan-400" /> Current Chat ({messages.length} msgs)
                    </span>
                    <span className="font-mono text-[#f4f4f2]">{chatTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9a9a94]">
                    <span className="flex items-center gap-1.5">
                      <Brain className="w-3 h-3 text-emerald-400" /> Chat Memory ({chatNotes.length} notes)
                    </span>
                    <span className="font-mono text-[#f4f4f2]">{memoryTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex items-center justify-between text-[#9a9a94] pt-0.5 border-t border-[#262626]">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-brand-300" /> Remaining
                    </span>
                    <span className="font-mono text-emerald-400">
                      {Math.max(0, contextWindowLimit - totalUsedTokens).toLocaleString()} tokens free
                    </span>
                  </div>
                </div>
              </div>
            }
            side="bottom"
          >
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#262626] border border-[#303030] hover:border-brand-500/40 transition-colors cursor-pointer text-xs">
              <Activity className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <div className="hidden sm:flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 font-mono text-[11px] leading-tight">
                  <span className="text-[#f4f4f2] font-semibold">{formatTokens(totalUsedTokens)}</span>
                  <span className="text-[#9a9a94]">/</span>
                  <span className="text-[#9a9a94]">{formatTokens(contextWindowLimit)}</span>
                </div>
                <div className="w-16 h-1 bg-[#191919] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      usedPercentage > 85 ? 'bg-rose-500' : usedPercentage > 65 ? 'bg-amber-400' : 'bg-brand-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, usedPercentage))}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#191919] text-brand-300 border border-[#303030]">
                {usedPercentage < 0.1 && totalUsedTokens > 0 ? '<0.1%' : `${usedPercentage.toFixed(1)}%`}
              </span>
            </div>
          </Tooltip>
          {/* Tablet right drawer trigger */}
          <button
            onClick={() => setTabletDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs text-[#9a9a94] hover:text-[#f4f4f2] p-1.5 rounded-lg hover:bg-[#262626] transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Studio</span>
          </button>

          {/* Desktop Expand Right Panel if closed */}
          {!studioPanelOpen && (
            <button
              onClick={() => setStudioPanelOpen(true)}
              className="hidden lg:flex items-center gap-2 text-xs font-display font-semibold text-[#9a9a94] hover:text-[#f4f4f2] px-3 py-1.5 rounded-xl bg-[#262626] border border-[#303030] hover:border-brand-500/40 transition-colors cursor-pointer"
              title="Expand right sidebar"
            >
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Context & Studio</span>
              <PanelRightOpen className="w-4 h-4 text-brand-400" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages / Stage Area */}
      <div
        ref={chatScrollContainerRef}
        className="flex-1 min-h-0 min-w-0 w-full overflow-y-auto p-4 md:p-6 flex flex-col scrollbar-thin scrollbar-thumb-[#303030] overscroll-contain"
        data-lenis-prevent
      >
        {isLoadingMessages ? (
          /* Loading conversation messages */
          <div className="max-w-xl w-full mx-auto my-auto py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#9a9a94] font-serif">Loading conversation...</p>
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          /* Empty State: Greeting, Prompt suggestions, and Recents List */
          <div className="max-w-xl w-full mx-auto my-auto py-6 text-center space-y-4">
            {/* Brand-Accented Brain Badge */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 via-brand-500/10 to-transparent border border-brand-500/40 flex items-center justify-center mx-auto shadow-xl shadow-brand-600/15">
              <Brain className="w-7 h-7 text-brand-400" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#f4f4f2]">
                {notebook.title}
              </h1>
              <p className="text-xs md:text-sm text-[#9a9a94] font-serif max-w-md mx-auto leading-relaxed">
                {sources.length === 0
                  ? 'Upload your first study document or web link to start asking source-grounded questions.'
                  : `Ready to answer questions strictly grounded in your ${enabledCount} enabled source${
                      enabledCount === 1 ? '' : 's'
                    }.`}
              </p>
            </div>

            {/* Suggested Prompts */}
            {sources.length > 0 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                <div
                  onClick={() =>
                    handleSendAction(
                      'Summarize the key findings and core takeaways across all uploaded sources.'
                    )
                  }
                  className="p-3.5 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2c2c2c] cursor-pointer transition-all shadow-sm group"
                >
                  <p className="text-xs font-display font-semibold text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                    “Summarize key findings”
                  </p>
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                    Extract core takeaways with citations
                  </p>
                </div>

                <div
                  onClick={() =>
                    handleSendAction(
                      'Explain the most difficult concepts in these sources in plain language.'
                    )
                  }
                  className="p-3.5 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2c2c2c] cursor-pointer transition-all shadow-sm group"
                >
                  <p className="text-xs font-display font-semibold text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                    “Explain difficult concepts”
                  </p>
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                    Step-by-step breakdown & analogies
                  </p>
                </div>

                <div
                  onClick={() => {
                    onSelectMode?.('quiz');
                    handleSendAction(
                      'Generate 5 quiz questions based strictly on the provided materials.'
                    );
                  }}
                  className="p-3.5 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2c2c2c] cursor-pointer transition-all shadow-sm group"
                >
                  <p className="text-xs font-display font-semibold text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                    “Generate 5 test questions”
                  </p>
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                    Test your memory and comprehension
                  </p>
                </div>

                <div
                  onClick={() =>
                    handleSendAction(
                      'Compare and contrast the main viewpoints or arguments in these documents.'
                    )
                  }
                  className="p-3.5 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2c2c2c] cursor-pointer transition-all shadow-sm group"
                >
                  <p className="text-xs font-display font-semibold text-[#f4f4f2] group-hover:text-brand-300 transition-colors">
                    “Compare viewpoints”
                  </p>
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                    Cross-source analytical synthesis
                  </p>
                </div>
              </div>
            )}

            {/* Recents List for Notebook Home */}
            {conversations.length > 0 && (
              <div className="pt-4 border-t border-[#303030] text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider font-display font-bold text-[#9a9a94]">
                    Recent Conversations
                  </span>
                  <span className="text-[10px] text-[#9a9a94] font-mono">
                    {conversations.length} saved
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-[#303030]">
                  {conversations.slice(0, 5).map((conv) => {
                    const isChatActive = conv.id === activeConversationId;
                    return (
                      <div
                        key={conv.id}
                        className={`group flex items-center justify-between p-2 rounded-xl transition ${
                          isChatActive
                            ? 'bg-brand-500/15 border border-brand-500/40 text-[#f4f4f2]'
                            : 'bg-[#262626] border border-[#303030] hover:border-brand-500/50 hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectConversation?.(conv.id);
                          }}
                          className="flex items-center gap-2 min-w-0 flex-1 text-left bg-transparent border-0 outline-none cursor-pointer py-0.5"
                          title={`Switch to "${conv.title}"`}
                        >
                          <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isChatActive ? 'text-brand-400' : 'text-brand-400/80'}`} />
                          <span className={`text-xs font-display font-medium truncate ${isChatActive ? 'text-brand-200 font-semibold' : 'text-[#f4f4f2]'}`}>
                            {conv.title}
                          </span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#191919] text-[#9a9a94] font-mono border border-[#303030] shrink-0">
                            {conv.mode}
                          </span>
                          {isChatActive && (
                            <Check className="w-3.5 h-3.5 text-brand-400 shrink-0 ml-auto mr-1" />
                          )}
                        </button>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                          {onDeleteConversation && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete chat "${conv.title}"?`)) {
                                  onDeleteConversation(conv.id);
                                }
                              }}
                              className="p-1 text-[#9a9a94] hover:text-red-400 rounded hover:bg-[#303030] transition cursor-pointer"
                              title="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Conversation Thread */
          <div className="max-w-3xl w-full min-w-0 mx-auto space-y-5 pb-6 mt-auto">
            {messages
              .filter((m) => m.content && m.content.trim().length > 0)
              .map((m, index) => {
                const isUser = m.role === 'user';
                const isCopied = copiedMessageId === m.id;
                const feedback = feedbackMap[m.id];

                const isEditing = editingMessageId === m.id;

                return (
                  <AIMessage from={isUser ? 'user' : 'assistant'} key={m.id || index}>
                    {isUser ? (
                      <div className="group/user-msg flex flex-col items-end w-fit max-w-[85%] sm:max-w-xl md:max-w-2xl min-w-0">
                        {isEditing ? (
                          <div className="w-full max-w-xl space-y-2 p-1">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={3}
                              className="w-full p-3.5 rounded-2xl bg-[#262626] border border-brand-500/60 text-sm font-sans leading-relaxed text-[#f4f4f2] focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none shadow-lg"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingContent('');
                                }}
                                className="px-3 py-1 text-xs font-display text-[#9a9a94] hover:text-[#f4f4f2] rounded-lg hover:bg-[#262626] transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editingContent.trim()) return;
                                  onEditMessage?.(m.id, editingContent.trim());
                                  setEditingMessageId(null);
                                }}
                                className="px-3 py-1 text-xs font-display font-medium bg-[#303030] hover:bg-[#383838] text-[#f4f4f2] rounded-lg transition cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editingContent.trim()) return;
                                  const text = editingContent.trim();
                                  setEditingMessageId(null);
                                  if (onResendMessage) {
                                    onResendMessage(m.id, text);
                                  } else {
                                    onEditMessage?.(m.id, text);
                                    handleSendAction(text);
                                  }
                                }}
                                className="px-3 py-1 text-xs font-display font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition cursor-pointer"
                              >
                                Save & Resend
                              </button>
                            </div>
                          </div>
                        ) : (
                          <AIMessageContent from="user" className="w-fit max-w-full text-left">
                            {m.content}
                          </AIMessageContent>
                        )}

                        {/* Timestamp & Action buttons below user message: shown on card hover with tooltips */}
                        {!isEditing && (
                          <div className="flex items-center gap-2 mt-1.5 justify-end select-none text-[#71717a] opacity-0 group-hover/user-msg:opacity-100 transition-opacity duration-200 w-full">
                            <span className="text-[11px] font-sans">
                              {formatRelativeTime(m.createdAt)}
                            </span>

                            <div className="flex items-center gap-0.5">
                              {/* Retry / Resend prompt */}
                              <Tooltip content="Resend prompt & regenerate" side="top">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (onResendMessage) {
                                      onResendMessage(m.id, m.content);
                                    } else {
                                      handleSendAction(m.content);
                                    }
                                  }}
                                  className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f2] hover:bg-[#262626] transition-colors cursor-pointer"
                                  aria-label="Resend prompt"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>

                              {/* Edit prompt */}
                              <Tooltip content="Edit message" side="top">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(m.id);
                                    setEditingContent(m.content);
                                  }}
                                  className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f2] hover:bg-[#262626] transition-colors cursor-pointer"
                                  aria-label="Edit message"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </Tooltip>

                              {/* Copy prompt text */}
                              <Tooltip content={isCopied ? 'Copied!' : 'Copy message'} side="top">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(m.id, m.content)}
                                  className="p-1 rounded-md text-[#71717a] hover:text-[#f4f4f2] hover:bg-[#262626] transition-colors cursor-pointer"
                                  aria-label="Copy message text"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </Tooltip>

                              {/* Delete message */}
                              {onDeleteMessage && (
                                <Tooltip content="Delete prompt & response" side="top">
                                  <button
                                    type="button"
                                    onClick={() => onDeleteMessage(m.id)}
                                    className="p-1 rounded-md text-[#71717a] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    aria-label="Delete message"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <AIMessageContent from="assistant">
                          {/* shadcn AI-Elements Sources Component */}
                          {m.citations && m.citations.length > 0 && (
                            <AISources defaultOpen={false}>
                              <AISourcesTrigger count={m.citations.length} />
                              <AISourcesContent>
                                {m.citations.map((c) => (
                                  <AISourceItem
                                    key={`${c.sourceId}-${c.chunkId || c.citationNumber}`}
                                    citation={c}
                                    onCitationClick={onCitationClick}
                                  />
                                ))}
                              </AISourcesContent>
                            </AISources>
                          )}

                          {/* Response Markdown */}
                          <MessageMarkdown
                            content={m.content}
                            citations={m.citations}
                            mode={selectedMode}
                            onCitationClick={onCitationClick}
                            onNewQuiz={() =>
                              handleSendAction('Generate a new quiz based on these sources')
                            }
                          />

                          {/* shadcn AI-Elements MessageActions */}
                          <AIMessageActions>
                            <div className="flex items-center gap-1.5">
                              {onSaveNoteFromMessage && (
                                <AIMessageAction
                                  tooltip="Save response to notebook memory notes"
                                  onClick={() =>
                                    onSaveNoteFromMessage(
                                      m.content,
                                      `${selectedMode.toUpperCase()} Insight`
                                    )
                                  }
                                >
                                  <Bookmark className="w-3.5 h-3.5 text-brand-400" />
                                  <span>Save to note</span>
                                </AIMessageAction>
                              )}

                              <AIMessageAction
                                tooltip="Copy text"
                                onClick={() => handleCopyMessage(m.id, m.content)}
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </AIMessageAction>
                            </div>

                            <div className="flex items-center gap-1">
                              <AIMessageAction
                                tooltip="Helpful response"
                                active={feedback === 'up'}
                                onClick={() => handleFeedback(m.id, 'up')}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </AIMessageAction>
                              <AIMessageAction
                                tooltip="Unhelpful response"
                                active={feedback === 'down'}
                                onClick={() => handleFeedback(m.id, 'down')}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </AIMessageAction>

                              {index === messages.length - 1 && (
                                <AIMessageAction
                                  tooltip="Regenerate response"
                                  onClick={() => {
                                    const lastUserMsg = messages
                                      .slice()
                                      .reverse()
                                      .find((msg) => msg.role === 'user');
                                    if (lastUserMsg) {
                                      handleSendAction(lastUserMsg.content);
                                    }
                                  }}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </AIMessageAction>
                              )}
                            </div>
                          </AIMessageActions>
                        </AIMessageContent>
                      )}
                  </AIMessage>
                );
              })}

            {/* Real-time Streaming Turn with shadcn AI-Elements */}
            {isStreaming && (
              <AIMessage from="assistant">
                <AIMessageContent from="assistant">
                  {/* Top Header Row while streaming: Reasoning with Shimmer */}
                  <div className="w-full min-w-0">
                    <AIReasoning isStreaming={!streamingContent.trim()}>
                      <AIReasoningTrigger
                        title={
                          streamingCitations && streamingCitations.length > 0
                            ? `Synthesizing ${streamingCitations.length} source passages...`
                            : 'Thinking & analyzing notebook sources...'
                        }
                      />
                      <AIReasoningContent>
                        <p>
                          Searching source chunks, retrieving grounded evidence, and synthesizing insights with citations.
                        </p>
                      </AIReasoningContent>
                    </AIReasoning>
                  </div>

                  {/* AI-Elements Sources while streaming */}
                  {streamingCitations && streamingCitations.length > 0 && (
                    <AISources defaultOpen={false}>
                      <AISourcesTrigger count={streamingCitations.length} />
                      <AISourcesContent>
                        {streamingCitations.map((c) => (
                          <AISourceItem
                            key={`streaming-${c.sourceId}-${c.chunkId || c.citationNumber}`}
                            citation={c}
                            onCitationClick={onCitationClick}
                          />
                        ))}
                      </AISourcesContent>
                    </AISources>
                  )}

                  {streamingContent.trim() ? (
                    <div className="relative w-full min-w-0">
                      <MessageMarkdown
                        content={streamingContent}
                        citations={streamingCitations}
                        mode={selectedMode}
                        onCitationClick={onCitationClick}
                      />
                      <span className="inline-block w-2 h-4 ml-1.5 rounded-sm bg-brand-400 align-middle animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    </div>
                  ) : (
                    /* Professional Shimmer Generating State matching Claude / ChatGPT / Gemini */
                    <div className="space-y-3 py-2.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center shrink-0 w-2.5 h-2.5">
                          <span className="absolute w-2.5 h-2.5 rounded-full bg-brand-400/50 animate-ping" />
                          <span className="relative w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
                        </div>
                        <AIShimmer
                          as="span"
                          duration={2}
                          baseColor="#9ca3af"
                          highlightColor="#ffffff"
                          className="text-xs font-display font-medium tracking-wide"
                        >
                          Generating grounded response...
                        </AIShimmer>
                      </div>
                      <div className="space-y-2 max-w-md pt-0.5 opacity-40">
                        <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#262626] via-[#3a3a3a] to-[#262626] bg-[length:200%_100%] animate-pulse" />
                        <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-[#262626] via-[#3a3a3a] to-[#262626] bg-[length:200%_100%] animate-pulse" />
                      </div>
                    </div>
                  )}
                </AIMessageContent>
              </AIMessage>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Docked Large Rounded Input Card (Claude Warm Charcoal #262626) with shadcn AI-Elements */}
      <div className="p-4 md:px-8 pb-6 border-t border-[#303030] bg-gradient-to-t from-[#191919] via-[#191919] to-transparent">
        {/* Suggestion Chips */}
        {sources.length > 0 && (
          <div className="max-w-3xl w-full min-w-0 mx-auto mb-2.5 px-1">
            <AISuggestions>
              <AISuggestion
                suggestion="Summarize core themes"
                onSelectSuggestion={(s) => handleSendAction(s)}
              />
              <AISuggestion
                suggestion="What are the key frameworks?"
                onSelectSuggestion={(s) => handleSendAction(s)}
              />
              <AISuggestion
                suggestion="Create a quiz from sources"
                onSelectSuggestion={(s) => handleSendAction(s)}
              />
              <AISuggestion
                suggestion="Explain the Delegation Loop"
                onSelectSuggestion={(s) => handleSendAction(s)}
              />
            </AISuggestions>
          </div>
        )}

        <AIPromptInput>
          {/* Text Input Area */}
          <AIPromptInputTextarea
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && isStreaming && onStopStreaming) {
                e.preventDefault();
                onStopStreaming();
                return;
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendAction();
              }
            }}
            placeholder={
              userKeys.length === 0
                ? 'Connect an API key in the model switcher below to start chatting...'
                : sources.length === 0
                ? 'Add sources in Context sidebar, then ask questions...'
                : selectedMode === 'learn'
                ? t('placeholder_learn')
                : selectedMode === 'quiz'
                ? t('placeholder_quiz')
                : t('placeholder_chat')
            }
          />

          {/* Bottom Action Controls */}
          <AIPromptInputTools>
            <div className="flex items-center gap-2">
              {/* Add Source Fast Button */}
              <Tooltip content={t('attach_source')} side="top">
                <button
                  type="button"
                  onClick={onOpenAddSource}
                  className="p-1.5 rounded-xl bg-[#191919] hover:bg-[#303030] text-[#9a9a94] hover:text-brand-400 border border-[#303030] transition-colors cursor-pointer"
                >
                <Paperclip className="w-4 h-4" />
                </button>
              </Tooltip>

              <ModeDropdownSwitcher
                selectedMode={selectedMode}
                onSelectMode={onSelectMode}
                selectedModelId={selectedModelId}
              />

              {/* Model Selector Dropdown with connected keys */}
              <ModelSwitcher
                selectedModelId={selectedModelId}
                onSelectModel={(mId) => onSelectModelId?.(mId)}
                userKeys={userKeys}
                onOpenManageKeys={onOpenManageKeys || onOpenSettings}
              />

              {/* Sources Count Badge */}
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-display text-[#9a9a94]">
                <BookOpen className="w-3 h-3" />
                {enabledCount === 0
                  ? t('source_chip_none')
                  : enabledCount === 1
                  ? t('source_chip_single')
                  : t('source_chip_multi', enabledCount)}
              </span>
            </div>

            {/* Mic & Send Controls */}
            <div className="flex items-center gap-1.5">
              {/* Mic Input wrapped with CapabilityGate */}
              <CapabilityGate feature="audioInput" modelId={selectedModelId}>
                <Tooltip content={t('voice_input')} side="top">
                  <button
                    type="button"
                    className="p-2 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#191919] transition-colors cursor-pointer"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </Tooltip>
              </CapabilityGate>

              {/* Send / Stop Button */}
              {isStreaming ? (
                <Tooltip content={`${t('stop_generating')} (Esc)`} side="top">
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    className="h-8 w-8 rounded-full bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                    title={t('stop_generating')}
                    aria-label={t('stop_generating')}
                  >
                    <span className="w-3 h-3 rounded-[2px] bg-[#ef4444]" />
                  </button>
                </Tooltip>
              ) : (
                <div className="relative group">
                  <Tooltip content={t('send_message')} side="top">
                    <Button
                      size="sm"
                      disabled={userKeys.length === 0 || !chatPrompt.trim()}
                      onClick={() => handleSendAction()}
                      className="h-8 w-8 p-0 rounded-xl bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                  </Tooltip>

                  {userKeys.length === 0 && (
                    <div
                      onClick={onOpenManageKeys || onOpenSettings}
                      className="absolute right-0 bottom-full mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#191919] border border-[#303030] text-xs text-[#f4f4f2] shadow-2xl whitespace-nowrap cursor-pointer hover:border-brand-500/50"
                    >
                      <Key className="w-3.5 h-3.5 text-brand-400" />
                      <span>Add an API key to start chatting</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AIPromptInputTools>
        </AIPromptInput>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#191919]">
      {/* ---------------------------------------------------- */}
      {/* DESKTOP LAYOUT (>= lg): Center Chat + Right Sidebar   */}
      {/* Left Sources panel REMOVED completely!               */}
      {/* ---------------------------------------------------- */}
      <div className="hidden lg:flex flex-1 min-w-0 h-full overflow-hidden">
        {/* Centre Chat Area */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {renderCentreContent()}
        </div>

        {/* Right Sidebar: Context & Studio */}
        <AnimatePresence initial={false}>
          {studioPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="h-full overflow-hidden flex-shrink-0"
            >
              <div className="w-[360px] h-full min-h-0 flex flex-col overflow-hidden" data-lenis-prevent>
                {renderRightSidebarContent(false)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TABLET LAYOUT (md to lg): Center main + right drawer  */}
      {/* ---------------------------------------------------- */}
      <div className="hidden md:flex lg:hidden flex-1 min-w-0 h-full relative overflow-hidden">
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {renderCentreContent()}
        </div>

        {/* Tablet Right Drawer (Context & Studio) */}
        <AnimatePresence>
          {tabletDrawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setTabletDrawerOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 bottom-0 right-0 w-84 z-40 shadow-2xl"
              >
                {renderRightSidebarContent(true)}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MOBILE LAYOUT (< md): Bottom Tabs                     */}
      {/* ---------------------------------------------------- */}
      <div className="flex md:hidden flex-1 min-w-0 flex-col h-full overflow-hidden">
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          {mobileTab === 'chat' && renderCentreContent()}
          {mobileTab === 'context' && renderRightSidebarContent(true)}
          {mobileTab === 'studio' && renderRightSidebarContent(true)}
        </div>

        <div className="h-14 border-t border-[#303030] bg-[#1f1f1f] flex items-center justify-around px-2 z-20">
          <button
            onClick={() => setMobileTab('chat')}
            className={`flex flex-col items-center gap-1 py-1 px-4 text-xs rounded-xl transition-colors ${
              mobileTab === 'chat'
                ? 'text-brand-400 font-semibold'
                : 'text-[#9a9a94] hover:text-[#f4f4f2]'
            }`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px] font-display font-medium">Chat</span>
          </button>

          <button
            onClick={() => {
              setMobileTab('context');
              setStudioTab('context');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 text-xs rounded-xl transition-colors ${
              mobileTab === 'context'
                ? 'text-brand-400 font-semibold'
                : 'text-[#9a9a94] hover:text-[#f4f4f2]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-display font-medium">Context ({enabledCount})</span>
          </button>

          <button
            onClick={() => {
              setMobileTab('studio');
              setStudioTab('studio');
            }}
            className={`flex flex-col items-center gap-1 py-1 px-3 text-xs rounded-xl transition-colors ${
              mobileTab === 'studio'
                ? 'text-brand-400 font-semibold'
                : 'text-[#9a9a94] hover:text-[#f4f4f2]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-display font-medium">Studio</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODALS: Instructions, Memory, Rename, Delete, Studio */}
      {/* ---------------------------------------------------- */}

      {/* 1. Edit Instructions Modal */}
      <Dialog
        open={editInstructionsOpen}
        onOpenChange={setEditInstructionsOpen}
        title="Notebook Instructions"
        description="Set the custom system prompt: persona, tone, level, and answering rules for this notebook."
      >
        <div className="space-y-4 pt-2">
          <Textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            rows={5}
            placeholder="e.g. ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources..."
            className="w-full bg-[#191919] border-[#303030]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditInstructionsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={savingInstructions}
              onClick={handleSaveInstructions}
            >
              {savingInstructions ? 'Saving...' : 'Save Instructions'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 2. Read-Only Memory Modal */}
      <Dialog
        open={viewMemoryOpen}
        onOpenChange={setViewMemoryOpen}
        title={t('view_memory_title')}
        description={t('view_memory_heading')}
        className="max-w-2xl"
      >
        <div className="space-y-4 pt-2">
          {/* Header Action / Badge: Read-Only */}
          <div className="flex items-center justify-between pb-2 border-b border-[#303030]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9a9a94] font-mono">{chatNotes.length} saved memories</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30 text-[10px] font-display font-medium">
                <Lock className="w-2.5 h-2.5" /> Read-Only · Auto-Saved
              </span>
            </div>
            <span className="text-[11px] text-[#9a9a94] font-serif">
              Scoped to this chat
            </span>
          </div>

          {/* Notes List (Strictly Read-Only: No Add, No Edit, No Delete) */}
          <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-[#303030]">
            {chatNotes.length === 0 ? (
              <div className="py-12 text-center text-[#9a9a94] text-xs font-serif space-y-2">
                <Brain className="w-8 h-8 text-[#9a9a94] mx-auto opacity-40" />
                <p className="text-[#f4f4f2] font-semibold">No memories stored for this chat yet</p>
                <p className="max-w-md mx-auto text-[#9a9a94]">
                  As you chat with your learning partner, key insights and context from this chat are automatically extracted and remembered here.
                </p>
              </div>
            ) : (
              chatNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-2xl bg-[#191919] border border-[#303030] hover:border-brand-500/40 transition group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-400" />
                      <h4 className="text-xs font-display font-bold text-[#f4f4f2]">{note.title}</h4>
                    </div>
                    <span className="text-[10px] text-[#9a9a94] font-mono">
                      Auto-saved
                    </span>
                  </div>
                  <p className="text-xs text-[#9a9a94] font-serif leading-relaxed whitespace-pre-wrap pl-4 border-l border-[#303030]">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </Dialog>

      {/* 4. Rename Source Modal */}
      <Dialog
        open={!!renamingSource}
        onOpenChange={(open) => !open && setRenamingSource(null)}
        title="Rename Source"
        description="Update the display title for this referenced source."
      >
        <div className="space-y-4 pt-2">
          <Input
            value={newSourceTitle}
            onChange={(e) => setNewSourceTitle(e.target.value)}
            placeholder="Source title"
            autoFocus
            className="bg-[#191919] border-[#303030]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenamingSource(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={savingRename || !newSourceTitle.trim()}
              onClick={handleConfirmRename}
            >
              {savingRename ? 'Saving...' : 'Rename'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* 5. Delete Source Confirm Modal */}
      <Dialog
        open={!!deletingSource}
        onOpenChange={(open) => !open && setDeletingSource(null)}
        title="Delete Source"
        description={`Are you sure you want to delete "${deletingSource?.title}"? This will remove its extracted text and indexed chunks.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={() => setDeletingSource(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
          >
            {isDeleting ? 'Deleting...' : 'Delete Source'}
          </Button>
        </div>
      </Dialog>

      {/* 6. Studio Action Preview Modal */}
      <Dialog
        open={!!selectedStudioAction}
        onOpenChange={(open) => !open && setSelectedStudioAction(null)}
        title={selectedStudioAction?.title || 'Studio Tool'}
        description={selectedStudioAction?.desc || ''}
      >
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#191919] border border-[#303030] text-xs text-[#9a9a94] font-serif space-y-2">
            <p>
              In Phase 3, this tool will synthesize your{' '}
              <span className="text-[#f4f4f2] font-semibold">{enabledCount} enabled sources</span>{' '}
              using Gemini AI into interactive outputs with inline source citations.
            </p>
            <p>
              You can configure your custom AI Model and study preferences in the AI Settings dialog.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedStudioAction(null);
                onOpenSettings();
              }}
              className="text-xs border-[#303030] text-brand-400 hover:text-brand-300"
            >
              <Key className="w-3.5 h-3.5 mr-1" />
              Configure API Key
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setSelectedStudioAction(null)}
            >
              Got it
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
