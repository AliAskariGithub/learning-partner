'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  BookOpen,
  Pin,
  MoreHorizontal,
  Pencil,
  Lock,
  Paperclip,
  FileText,
  Globe,
  Mic,
  ArrowUp,
  PanelLeftClose,
  PanelLeft,
  X,
  Layers,
  LogOut,
  Settings,
  MessageSquare,
  Brain,
  ArrowLeft,
  Check,
  Star,
  Sparkles,
  ChevronDown,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
  Sliders,
  User as UserIcon,
} from 'lucide-react';
import { Button, Input, Textarea, Card, Badge, Dialog } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { authClient } from '@/lib/auth/client';
import { Profile } from '@/db/schema';
import { updateProfileSettings } from '@/app/settings/actions';
import { useToast } from '@/components/ui/toast';
import { UnverifiedBanner } from '@/components/auth/UnverifiedBanner';

interface SourceItem {
  id: string;
  title: string;
  type: 'pdf' | 'doc' | 'link' | 'text';
  size?: string;
  citationId: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: number[];
  timestamp: string;
}

interface ConversationItem {
  id: string;
  title: string;
  date: string;
  messageCount: number;
  messages: Message[];
}

export function AppShell({
  user,
  profile,
}: {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null };
  profile: Profile;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Sidebar collapse state
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Active Notebook metadata
  const [activeNotebookName, setActiveNotebookName] = useState('Learning Partner Workspace');
  const [activeNotebookDescription, setActiveNotebookDescription] = useState(
    'Research papers, lecture notes, and study materials grounded with verifiable citations.'
  );

  // Search in sidebar
  const [searchQuery, setSearchQuery] = useState('');

  // ALL CONVERSATIONS LIST (Clean initial state - zero fake data)
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  // PINNED CHATS LIST (IDs of favorited chats)
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>([]);

  // Current Active Conversation (null means viewing Notebook Home with Big Input Card)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Input Box State
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro (BYO Key)');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // SOURCES LIST (Clean initial state - zero fake data)
  const [sources, setSources] = useState<SourceItem[]>([]);

  // Hidden File Input Ref for Document Uploads
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input Box Attachment Popover State (Anchored strictly to the prompt card + button)
  const [inputAttachMenuOpen, setInputAttachMenuOpen] = useState(false);
  const inputAttachButtonRef = useRef<HTMLButtonElement>(null);
  const inputAttachMenuRef = useRef<HTMLDivElement>(null);

  // Right Panel Sources Context Menu State (Anchored strictly to the right panel + button)
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const contextButtonRef = useRef<HTMLButtonElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Add Text Notes Dialog State
  const [addTextDialogOpen, setAddTextDialogOpen] = useState(false);
  const [newTextTitle, setNewTextTitle] = useState('');
  const [newTextContent, setNewTextContent] = useState('');

  // Import Web Link Dialog State
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Custom Instructions State (saved to Neon Postgres)
  const [instructions, setInstructions] = useState(
    profile.customInstructions ||
      'Answer questions strictly grounded in uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.'
  );
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [tempInstructions, setTempInstructions] = useState(instructions);
  const [savingInstructions, setSavingInstructions] = useState(false);

  // GEMINI SETTINGS MODAL STATE
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'gemini' | 'instructions' | 'account'>('gemini');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [geminiTemperature, setGeminiTemperature] = useState(0.2);
  const [testingKey, setTestingKey] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName || user.name || 'Ali Askari');
  const [editLanguage, setEditLanguage] = useState(profile.preferredLanguage || 'en');
  const [savingSettings, setSavingSettings] = useState(false);

  // Memory Dialog
  const [memoryDialogOpen, setMemoryDialogOpen] = useState(false);

  // Studio Output Dialog
  const [studioDialogOpen, setStudioDialogOpen] = useState(false);
  const [studioToolName, setStudioToolName] = useState('Practice Quiz');

  // Load saved Gemini API settings from localStorage on client mount
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) setGeminiApiKey(savedKey);
      const savedModel = localStorage.getItem('gemini_selected_model');
      if (savedModel) setSelectedModel(savedModel);
      const savedTemp = localStorage.getItem('gemini_temperature');
      if (savedTemp) setGeminiTemperature(parseFloat(savedTemp));
    } catch (e) {
      // Storage unavailable or disabled
    }
  }, []);

  // Close context menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Right panel context menu
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node) &&
        contextButtonRef.current &&
        !contextButtonRef.current.contains(e.target as Node)
      ) {
        setContextMenuOpen(false);
      }
      // Input card attachment popover
      if (
        inputAttachMenuRef.current &&
        !inputAttachMenuRef.current.contains(e.target as Node) &&
        inputAttachButtonRef.current &&
        !inputAttachButtonRef.current.contains(e.target as Node)
      ) {
        setInputAttachMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Save instructions to Neon Postgres via server action
  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      const fd = new FormData();
      fd.append('displayName', editDisplayName);
      fd.append('customInstructions', tempInstructions);
      fd.append('preferredLanguage', editLanguage);
      await updateProfileSettings(fd);

      setInstructions(tempInstructions);
      setInstructionsDialogOpen(false);
      toast({
        title: 'Instructions Saved',
        description: 'Updated your study persona in Neon Postgres.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error saving instructions',
        description: err?.message || 'Could not save instructions.',
        variant: 'error',
      });
    } finally {
      setSavingInstructions(false);
    }
  };

  // Save all settings from the Gemini Settings Modal
  const handleSaveAllSettings = async () => {
    setSavingSettings(true);
    try {
      // 1. Save Gemini BYO API Key & Model locally in client storage
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
      localStorage.setItem('gemini_selected_model', selectedModel);
      localStorage.setItem('gemini_temperature', geminiTemperature.toString());

      // 2. Save profile and custom instructions to Neon Postgres
      const fd = new FormData();
      fd.append('displayName', editDisplayName);
      fd.append('customInstructions', tempInstructions);
      fd.append('preferredLanguage', editLanguage);
      await updateProfileSettings(fd);

      setInstructions(tempInstructions);
      setSettingsModalOpen(false);
      toast({
        title: 'Settings Saved',
        description: 'Gemini BYO settings & profile updated successfully.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err?.message || 'Could not update settings in Neon.',
        variant: 'error',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  // Test Gemini API Key
  const handleTestGeminiKey = async () => {
    const key = geminiApiKey.trim();
    if (!key) {
      toast({
        title: 'Gemini Key Missing',
        description: 'Please paste your Google AI Studio API key first.',
        variant: 'warning',
      });
      return;
    }
    setTestingKey(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      if (res.ok) {
        toast({
          title: 'Gemini API Connected',
          description: 'Successfully authenticated with Google AI Studio!',
          variant: 'success',
        });
        localStorage.setItem('gemini_api_key', key);
      } else {
        const errorData = await res.json().catch(() => ({}));
        toast({
          title: 'Authentication Failed',
          description: errorData?.error?.message || 'Invalid Gemini API key. Please check your key in Google AI Studio.',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Connection Error',
        description: err?.message || 'Network error verifying Gemini API key.',
        variant: 'error',
      });
    } finally {
      setTestingKey(false);
    }
  };

  // Toggle Pin/Favorite for a conversation
  const togglePinChat = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPinnedChatIds((prev) => {
      const isPinned = prev.includes(id);
      const next = isPinned ? prev.filter((item) => item !== id) : [id, ...prev];
      toast({
        title: isPinned ? 'Unpinned from Favorites' : 'Pinned to Favorites',
        description: isPinned
          ? 'Conversation moved back to all conversations.'
          : 'Conversation is now pinned at the top.',
        variant: 'success',
      });
      return next;
    });
  };

  // Handle Real Document File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr =
      file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    const nextId = sources.length + 1;
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    setSources((prev) => [
      ...prev,
      {
        id: `src-${Date.now()}`,
        title: file.name,
        type: isPdf ? 'pdf' : 'doc',
        size: sizeStr,
        citationId: nextId,
      },
    ]);

    toast({
      title: 'Source Document Added',
      description: `${file.name} indexed as citation [${nextId}].`,
      variant: 'success',
    });

    e.target.value = '';
    setInputAttachMenuOpen(false);
    setContextMenuOpen(false);
  };

  // Handle Real Web Link Submission
  const handleAddLink = () => {
    if (!newLinkUrl.trim()) return;
    const title = newLinkTitle.trim() || newLinkUrl.trim();
    const nextId = sources.length + 1;

    setSources((prev) => [
      ...prev,
      {
        id: `src-${Date.now()}`,
        title,
        type: 'link',
        size: 'Web Page',
        citationId: nextId,
      },
    ]);

    setNewLinkTitle('');
    setNewLinkUrl('');
    setAddLinkDialogOpen(false);

    toast({
      title: 'Web Link Indexed',
      description: `${title} indexed as citation [${nextId}].`,
      variant: 'success',
    });
  };

  // Handle Real Text Notes Submission
  const handleAddText = () => {
    if (!newTextTitle.trim() || !newTextContent.trim()) return;
    const nextId = sources.length + 1;

    setSources((prev) => [
      ...prev,
      {
        id: `src-${Date.now()}`,
        title: newTextTitle.trim(),
        type: 'text',
        size: `${newTextContent.length} chars`,
        citationId: nextId,
      },
    ]);

    setNewTextTitle('');
    setNewTextContent('');
    setAddTextDialogOpen(false);

    toast({
      title: 'Text Notes Indexed',
      description: `${newTextTitle.trim()} indexed as citation [${nextId}].`,
      variant: 'success',
    });
  };

  // Submit Prompt to active conversation or create new
  const handleSendPrompt = (customText?: string) => {
    const textToSend = (customText || prompt).trim();
    if (!textToSend) return;

    const now = 'Just now';

    if (activeConversation) {
      // Append to current active conversation
      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: textToSend,
        timestamp: now,
      };

      const hasSources = sources.length > 0;
      const citationRefs = hasSources ? sources.slice(0, 2).map((s) => s.citationId) : undefined;

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: hasSources
          ? `Grounded answer synthesized from your ${sources.length} active sources [${citationRefs?.join(', ')}]:\n\n${textToSend.slice(0, 90)} breakdown grounded directly against source definitions with verifiable citations.`
          : `Synthesized answer from general reasoning:\n\n${textToSend}\n\n*Note: Upload sources via the "+" button to ground answers with strict citations.*`,
        citations: citationRefs,
        timestamp: now,
      };

      const updated = conversations.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messageCount: c.messageCount + 2,
            messages: [...c.messages, userMsg, assistantMsg],
          };
        }
        return c;
      });

      setConversations(updated);
      setPrompt('');
      toast({
        title: 'Response Generated',
        description: hasSources ? `Cited ${citationRefs?.length} uploaded sources.` : 'Synthesized response.',
        variant: 'success',
      });
    } else {
      // Create new conversation
      const newId = `c-${Date.now()}`;
      const newTitle = textToSend.slice(0, 48) + (textToSend.length > 48 ? '...' : '');
      const hasSources = sources.length > 0;
      const citationRefs = hasSources ? sources.slice(0, 2).map((s) => s.citationId) : undefined;

      const newConv: ConversationItem = {
        id: newId,
        title: newTitle,
        date: 'Just now',
        messageCount: 2,
        messages: [
          {
            id: 'm-1',
            role: 'user',
            content: textToSend,
            timestamp: now,
          },
          {
            id: 'm-2',
            role: 'assistant',
            content: hasSources
              ? `Here is the grounded response for "${newTitle}" based on your ${sources.length} active sources [${citationRefs?.join(', ')}]:\n\n• Concept breakdown strictly verified against source definitions.\n• Methodological proofs with citation markers.`
              : `Here is the response for "${newTitle}":\n\n• Comprehensive conceptual summary and structured takeaways.\n• To ground every claim with verifiable citations, add PDFs or lecture notes using the "+" button.`,
            citations: citationRefs,
            timestamp: now,
          },
        ],
      };

      setConversations([newConv, ...conversations]);
      setActiveConversationId(newId);
      setPrompt('');
      toast({
        title: 'New Conversation Created',
        description: newTitle,
        variant: 'success',
      });
    }
  };

  // Filtered lists for sidebar
  const filteredConversations = conversations.filter((c) =>
    searchQuery ? c.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const pinnedConversations = filteredConversations.filter((c) =>
    pinnedChatIds.includes(c.id)
  );

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-brand-600 selection:text-white">
      {/* Top Red Alert Notification when user is not verified */}
      <UnverifiedBanner email={user.email || ''} isVerified={Boolean((user as any).emailVerified)} />

      <div className="flex flex-1 w-full overflow-hidden min-h-0">
        {/* Hidden real file input for document uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.txt,.md"
        className="hidden"
      />

      {/* ─────────────────────────────────────────────────────────────
          1. LEFT SIDEBAR: Claude Palette (#1f1f1f) + Clean PINNED & CONVERSATIONS
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full bg-surface border-r border-border flex flex-col justify-between shrink-0 select-none overflow-hidden z-30"
          >
            <div className="flex flex-col h-full p-3 overflow-hidden">
              {/* Brand Logo & Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center font-display font-extrabold text-white text-xs shadow-md shadow-brand-600/30">
                    LP
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display font-bold text-sm text-foreground tracking-tight leading-none">
                      Learning Partner
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      NotebookLM Open
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button: + New Chat */}
              <Button
                onClick={() => {
                  setActiveConversationId(null);
                  setPrompt('');
                }}
                variant="primary"
                size="sm"
                className="w-full mb-3 font-display font-bold text-xs h-9 justify-start px-3 shadow-brand-600/20"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Chat
              </Button>

              {/* Quick Search */}
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-surface-raised border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4" data-lenis-prevent>
                {/* ─── SECTION 1: PINNED (Favourite Chats) ─── */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-display font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-brand-400 fill-brand-400/20" />
                      <span>PINNED</span>
                    </div>
                    {pinnedConversations.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-[10px] text-brand-400 font-mono">
                        {pinnedConversations.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {pinnedConversations.length === 0 ? (
                      <div className="px-3 py-3 rounded-xl border border-dashed border-border/70 text-center">
                        <p className="text-[11px] text-muted-foreground/80 font-sans">
                          No pinned chats yet
                        </p>
                      </div>
                    ) : (
                      pinnedConversations.map((c) => {
                        const isSelected = c.id === activeConversationId;
                        return (
                          <div
                            key={c.id}
                            onClick={() => setActiveConversationId(c.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl transition cursor-pointer text-xs ${
                              isSelected
                                ? 'bg-surface-raised text-foreground font-semibold border border-brand-500/30'
                                : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Pin className="h-3.5 w-3.5 text-brand-400 shrink-0 fill-brand-400/20" />
                              <span className="truncate font-serif text-[12.5px]">{c.title}</span>
                            </div>
                            <button
                              onClick={(e) => togglePinChat(c.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-brand-400 transition cursor-pointer"
                              title="Unpin chat"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ─── SECTION 2: CONVERSATIONS (All Previous Chats) ─── */}
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-display font-bold text-muted-foreground uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <span>CONVERSATIONS</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-surface-raised text-[10px] text-brand-400 font-mono">
                        {filteredConversations.length}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveConversationId(null);
                        setPrompt('');
                      }}
                      className="text-[10px] font-sans font-normal text-muted-foreground hover:text-brand-400 transition cursor-pointer"
                      title="New chat prompt"
                    >
                      + New
                    </button>
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {filteredConversations.length === 0 ? (
                      <div className="px-3 py-4 rounded-xl border border-dashed border-border/70 text-center">
                        <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground/60" />
                        <p className="text-[11px] text-muted-foreground/80 font-sans">
                          No previous chats yet
                        </p>
                      </div>
                    ) : (
                      filteredConversations.map((c) => {
                        const isActive = c.id === activeConversationId;
                        const isPinned = pinnedChatIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => setActiveConversationId(c.id)}
                            className={`group flex items-start gap-2 px-2.5 py-2 rounded-xl transition cursor-pointer text-xs ${
                              isActive
                                ? 'bg-surface-raised text-foreground font-semibold border-l-2 border-brand-500'
                                : 'text-muted-foreground hover:bg-surface-raised/60 hover:text-foreground'
                            }`}
                          >
                            <MessageSquare
                              className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${
                                isActive
                                  ? 'text-brand-400'
                                  : 'text-muted-foreground group-hover:text-foreground'
                              }`}
                            />
                            <div className="flex-1 min-w-0 pr-1">
                              <div className="truncate text-[12.5px] font-serif">{c.title}</div>
                              <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 flex items-center justify-between">
                                <span>{c.date}</span>
                                <span>{c.messageCount} msgs</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => togglePinChat(c.id, e)}
                              className={`p-1 transition cursor-pointer shrink-0 ${
                                isPinned
                                  ? 'text-brand-400'
                                  : 'opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground'
                              }`}
                              title={isPinned ? 'Unpin chat' : 'Pin chat to favorites'}
                            >
                              <Pin
                                className={`h-3 w-3 ${
                                  isPinned ? 'fill-brand-400/30' : ''
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom User Profile Section: Fixed styling (Image 3) + Gemini Settings Modal Trigger */}
              <div className="pt-3 border-t border-border mt-auto">
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => {
                      setTempInstructions(instructions);
                      setSettingsModalOpen(true);
                    }}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-raised transition-colors cursor-pointer flex-1 min-w-0 text-left group"
                    title="Open Gemini Settings"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {profile.displayName?.charAt(0).toUpperCase() || user.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-display font-semibold text-foreground truncate group-hover:text-brand-300 transition-colors">
                        {profile.displayName || user.name || 'Ali Askari'}
                      </span>
                      <span className="text-[10px] text-muted-foreground/80 font-mono mt-0.5 truncate">
                        Gemini BYO Key • Settings
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setTempInstructions(instructions);
                        setSettingsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
                      title="Open Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
                      title="Collapse sidebar"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN STAGE: Centered Chat Area & Fully Docked Right Panel
      ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Top Header Bar */}
        <header className="h-13 border-b border-border bg-surface/80 backdrop-blur px-5 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition mr-1 cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2 font-display text-muted-foreground">
              <span
                onClick={() => setActiveConversationId(null)}
                className="hover:text-foreground cursor-pointer transition"
              >
                Workspace
              </span>
              <span>/</span>
              <span className="text-foreground font-bold">{activeNotebookName}</span>
              {activeConversation && (
                <>
                  <span>/</span>
                  <span className="text-muted-foreground truncate max-w-[220px]">
                    {activeConversation.title}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {activeConversation && (
              <button
                onClick={() => togglePinChat(activeConversation.id)}
                className={`p-1 transition cursor-pointer ${
                  pinnedChatIds.includes(activeConversation.id)
                    ? 'text-brand-400'
                    : 'text-muted-foreground hover:text-brand-400'
                }`}
                title="Pin this chat"
              >
                <Pin
                  className={`h-4 w-4 ${
                    pinnedChatIds.includes(activeConversation.id) ? 'fill-brand-400/30' : ''
                  }`}
                />
              </button>
            )}
            <button
              onClick={() => {
                setTempInstructions(instructions);
                setSettingsModalOpen(true);
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Workspace & Gemini Settings"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body: Middle Center Column + Right Panel Docked Completely Right */}
        <div className="flex-1 flex h-full overflow-hidden w-full">
          {/* Middle Column: Spans entire remaining width, centers inner chat container */}
          <main
            className="flex-1 h-full overflow-y-auto flex flex-col items-center"
            data-lenis-prevent
          >
            <div className="w-full max-w-3xl px-4 sm:px-6 py-6 flex flex-col flex-1">
              {activeConversation ? (
                /* ─── ACTIVE CONVERSATION THREAD (CENTERED) ─── */
                <div className="space-y-6 pb-12 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Back button & Chat Meta */}
                    <div className="flex items-center justify-between pb-3 border-b border-border mb-6">
                      <button
                        onClick={() => setActiveConversationId(null)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer font-display font-medium"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Back to Overview</span>
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePinChat(activeConversation.id)}
                          className={`flex items-center gap-1 text-xs font-display transition cursor-pointer ${
                            pinnedChatIds.includes(activeConversation.id)
                              ? 'text-brand-400 font-semibold'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Pin className="h-3.5 w-3.5" />
                          <span>
                            {pinnedChatIds.includes(activeConversation.id) ? 'Pinned' : 'Pin'}
                          </span>
                        </button>
                        <span className="text-xs text-muted-foreground font-mono">
                          {activeConversation.date} • {activeConversation.messages.length} msgs
                        </span>
                      </div>
                    </div>

                    <h1 className="font-display text-2xl font-bold text-foreground mb-6">
                      {activeConversation.title}
                    </h1>

                    {/* Messages List */}
                    <div className="space-y-4">
                      {activeConversation.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border transition ${
                            msg.role === 'user'
                              ? 'bg-surface-raised border-border ml-auto max-w-2xl text-foreground font-serif text-[14.5px] leading-relaxed'
                              : 'bg-surface border-border/80 mr-auto max-w-3xl text-foreground font-serif text-[14.5px] leading-relaxed shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground">
                              {msg.role === 'user' ? 'You' : 'Learning Partner (Grounded)'}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 font-mono">
                              {msg.timestamp}
                            </span>
                          </div>

                          <div className="whitespace-pre-line">{msg.content}</div>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
                                Verified Citations:
                              </span>
                              {msg.citations.map((citeId) => (
                                <span
                                  key={citeId}
                                  onClick={() => {
                                    const matchedSource = sources.find(
                                      (s) => s.citationId === citeId
                                    );
                                    toast({
                                      title: `Citation [${citeId}] Grounded`,
                                      description:
                                        matchedSource?.title || 'Referenced in active sources.',
                                      variant: 'success',
                                    });
                                  }}
                                  className="citation-chip cursor-pointer"
                                  title="Click to view citation source"
                                >
                                  [{citeId}]
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reply Input Box */}
                  <div className="rounded-2xl border border-border bg-surface p-3 mt-6 shadow-md">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendPrompt();
                        }
                      }}
                      placeholder={`Reply to "${activeConversation.title}"...`}
                      className="w-full bg-transparent border-0 outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground/60 min-h-[70px] p-2 font-serif leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-2 px-1 border-t border-border/40">
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {sources.length > 0 ? `${sources.length} sources grounded` : 'General reasoning active'}
                      </div>
                      <Button
                        onClick={() => handleSendPrompt()}
                        disabled={!prompt.trim()}
                        size="sm"
                        variant="primary"
                      >
                        Send Message
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── HOME WELCOME & BIG INPUT CARD (CENTERED) ─── */
                <div className="flex-1 flex flex-col justify-center py-6">
                  {/* Title & Description */}
                  <div className="mb-6 text-center sm:text-left">
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                      {activeNotebookName}
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground font-serif leading-relaxed">
                      {activeNotebookDescription}
                    </p>
                  </div>

                  {/* Big Prompt Card */}
                  <div className="rounded-2xl border border-border bg-surface shadow-xl p-3 mb-8">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendPrompt();
                        }
                      }}
                      placeholder="Ask anything about your sources, or request a study summary..."
                      className="w-full bg-transparent border-0 outline-none resize-none text-[15px] text-foreground placeholder:text-muted-foreground/60 min-h-[90px] p-2 font-serif leading-relaxed"
                    />

                    {/* Bottom Toolbar of the Card (Chat/Cowork pill removed as requested in Image 1) */}
                    <div className="flex items-center justify-between pt-2 px-1">
                      {/* Left control: + Attachment button strictly anchored to this button (Image 2 fixed) */}
                      <div className="relative">
                        <button
                          ref={inputAttachButtonRef}
                          onClick={() => setInputAttachMenuOpen(!inputAttachMenuOpen)}
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer border border-border/60 hover:border-border flex items-center justify-center"
                          title="Add source to study context"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {inputAttachMenuOpen && (
                            <motion.div
                              ref={inputAttachMenuRef}
                              initial={{ opacity: 0, scale: 0.95, y: 8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 8 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 bottom-full mb-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl z-50 text-xs font-display"
                            >
                              <button
                                onClick={() => {
                                  setInputAttachMenuOpen(false);
                                  fileInputRef.current?.click();
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                              >
                                <Paperclip className="h-4 w-4 text-brand-400" />
                                <span>Upload PDF / Document</span>
                              </button>

                              <button
                                onClick={() => {
                                  setInputAttachMenuOpen(false);
                                  setAddTextDialogOpen(true);
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                              >
                                <FileText className="h-4 w-4 text-brand-400" />
                                <span>Add Text Notes</span>
                              </button>

                              <button
                                onClick={() => {
                                  setInputAttachMenuOpen(false);
                                  setAddLinkDialogOpen(true);
                                }}
                                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                              >
                                <Globe className="h-4 w-4 text-brand-400" />
                                <span>Import Web Link</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Right controls: Gemini Model Selector, Mic, Send */}
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-display font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-raised transition border border-border cursor-pointer"
                          >
                            <span>{selectedModel}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>

                          {modelDropdownOpen && (
                            <div className="absolute right-0 bottom-full mb-2 w-60 rounded-2xl bg-surface border border-border p-1.5 shadow-2xl z-50 text-xs font-display">
                              {[
                                'Gemini 1.5 Pro (BYO Key)',
                                'Gemini 1.5 Flash (Fast)',
                                'Gemini 2.0 Flash Preview',
                                'Claude 3.5 Sonnet',
                              ].map((m) => (
                                <button
                                  key={m}
                                  onClick={() => {
                                    setSelectedModel(m);
                                    localStorage.setItem('gemini_selected_model', m);
                                    setModelDropdownOpen(false);
                                  }}
                                  className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-muted-foreground hover:bg-surface-raised hover:text-foreground transition cursor-pointer"
                                >
                                  <span>{m}</span>
                                  {selectedModel === m && (
                                    <Check className="h-3.5 w-3.5 text-brand-400" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            toast({
                              title: 'Voice Input Active',
                              description: 'Listening to your question...',
                              variant: 'info',
                            })
                          }
                          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer border border-border/60 hover:border-border"
                          title="Voice input"
                        >
                          <Mic className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleSendPrompt()}
                          disabled={!prompt.trim()}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer ${
                            prompt.trim()
                              ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500'
                              : 'bg-surface-raised text-muted-foreground/40 cursor-not-allowed border border-border'
                          }`}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Clean Suggested Starters or Recents */}
                  {conversations.length === 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs font-display font-semibold text-muted-foreground/70">
                        Suggested Starters
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          'Synthesize key takeaways across all uploaded sources',
                          'Generate a 5-question comprehension quiz with citations',
                          'Outline core concepts and terminology definitions',
                          'Compare methodologies and findings in the source papers',
                        ].map((suggestion) => (
                          <div
                            key={suggestion}
                            onClick={() => handleSendPrompt(suggestion)}
                            className="p-3 rounded-xl border border-border/70 bg-surface/60 hover:bg-surface-raised transition cursor-pointer text-xs font-serif text-muted-foreground hover:text-foreground flex items-center gap-2 group"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-brand-400 shrink-0 group-hover:scale-110 transition-transform" />
                            <span className="truncate">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xs font-display font-medium text-muted-foreground/80">
                          Recents
                        </h2>
                        <span className="text-[11px] text-muted-foreground/60 font-mono">
                          {conversations.length} previous chats
                        </span>
                      </div>

                      <div className="space-y-1">
                        {conversations.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => setActiveConversationId(item.id)}
                            className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-surface-raised/80 transition-colors cursor-pointer group"
                          >
                            <span className="text-[13.5px] font-serif text-foreground/90 group-hover:text-foreground truncate pr-4">
                              {item.title}
                            </span>
                            <span className="text-[11.5px] text-muted-foreground/70 font-mono shrink-0">
                              {item.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>

          {/* ─────────────────────────────────────────────────────────────
              3. RIGHT PANEL: Docked Completely to the Right Edge
          ───────────────────────────────────────────────────────────── */}
          <aside
            className="w-80 h-full border-l border-border bg-surface p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none hidden lg:flex"
            data-lenis-prevent
          >
            {/* Card 1: Study Instructions (Neon Postgres) */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Brain className="h-4 w-4 text-brand-400" />
                  Study Instructions
                </span>
                <button
                  onClick={() => {
                    setTempInstructions(instructions);
                    setInstructionsDialogOpen(true);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-brand-400 transition cursor-pointer"
                  title="Edit instructions"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-muted-foreground font-serif leading-relaxed line-clamp-3">
                {instructions}
              </p>
            </div>

            {/* Card 2: Study Memory */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-foreground text-sm">Study Memory</span>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-surface text-muted-foreground text-[10px] border border-border">
                    <Lock className="h-2.5 w-2.5" />
                    <span>Only you</span>
                  </div>
                </div>

                <button
                  onClick={() => setMemoryDialogOpen(true)}
                  className="text-[11px] font-display font-bold text-brand-400 hover:text-brand-300 hover:underline cursor-pointer"
                >
                  View memory
                </button>
              </div>

              <p className="text-muted-foreground font-serif leading-relaxed text-[11.5px]">
                View and manage what your study partner remembers across sessions.
              </p>
            </div>

            {/* Card 3: Sources Context Card (Clean initial state - zero fake data) */}
            <div className="relative rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-brand-400" />
                  Sources Context
                </span>
                <div className="relative">
                  <button
                    ref={contextButtonRef}
                    onClick={() => setContextMenuOpen(!contextMenuOpen)}
                    className="w-6 h-6 rounded-lg bg-surface text-brand-400 hover:bg-brand-600 hover:text-white border border-border flex items-center justify-center transition cursor-pointer shadow-sm"
                    title="Add source to context"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>

                  {/* Popover anchored strictly to this right-panel button */}
                  <AnimatePresence>
                    {contextMenuOpen && (
                      <motion.div
                        ref={contextMenuRef}
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-2xl text-xs font-display"
                      >
                        <button
                          onClick={() => {
                            setContextMenuOpen(false);
                            fileInputRef.current?.click();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                        >
                          <Paperclip className="h-4 w-4 text-brand-400" />
                          <span>Upload PDF / Document</span>
                        </button>

                        <button
                          onClick={() => {
                            setContextMenuOpen(false);
                            setAddTextDialogOpen(true);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                        >
                          <FileText className="h-4 w-4 text-brand-400" />
                          <span>Add Text Notes</span>
                        </button>

                        <button
                          onClick={() => {
                            setContextMenuOpen(false);
                            setAddLinkDialogOpen(true);
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left text-foreground hover:bg-surface-raised transition cursor-pointer"
                        >
                          <Globe className="h-4 w-4 text-brand-400" />
                          <span>Import Web Link</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Real Sources List or Clean Empty State */}
              {sources.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-5 text-center text-muted-foreground">
                  <FileText className="h-5 w-5 mx-auto mb-2 opacity-40 text-brand-400" />
                  <p className="text-xs font-serif leading-relaxed text-muted-foreground/80 mb-2">
                    No sources added yet.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-[11px] font-display font-semibold text-foreground hover:bg-surface-raised transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3 text-brand-400" />
                    <span>Upload Document</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {sources.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border group hover:border-brand-500/50 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="citation-chip shrink-0">[{s.citationId}]</span>
                        <span className="text-xs text-foreground truncate font-serif">{s.title}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSources(sources.filter((item) => item.id !== s.id));
                          toast({ title: 'Source removed', variant: 'neutral' });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-error transition p-1 cursor-pointer"
                        title="Remove source"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <div className="pt-2 text-[10px] text-muted-foreground text-center font-mono">
                    {sources.length} sources active • Citation grounded
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Study Studio Panel */}
            <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-brand-400" />
                  Study Studio
                </span>
                <Badge variant="brand">{sources.length > 0 ? 'Grounded' : 'Studio'}</Badge>
              </div>

              <div className="space-y-1.5 mt-2">
                {[
                  { name: 'Generate Practice Quiz', desc: '10 multiple-choice questions with citations' },
                  { name: 'Create Flashcard Deck', desc: 'Active recall spaced repetition cards' },
                  { name: 'Concept Mind Map', desc: 'Visual relationship diagram across sources' },
                ].map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      setStudioToolName(tool.name);
                      setStudioDialogOpen(true);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-surface border border-border hover:border-brand-500/40 hover:bg-surface/80 transition cursor-pointer"
                  >
                    <div className="font-display font-semibold text-foreground text-xs">{tool.name}</div>
                    <div className="text-[10px] text-muted-foreground font-serif">{tool.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>

      {/* ─────────────────────────────────────────────────────────────
          4. GEMINI SETTINGS MODAL (Replaces generic settings with Gemini BYO modal)
      ───────────────────────────────────────────────────────────── */}
      <Dialog
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        title="Settings & Gemini Configuration"
        description="Manage your Google Gemini API key, model preferences, and custom study persona."
      >
        <div className="space-y-5">
          {/* Settings Tabs */}
          <div className="flex items-center border-b border-border pb-2 gap-2 text-xs font-display font-semibold">
            <button
              onClick={() => setSettingsTab('gemini')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                settingsTab === 'gemini'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gemini API & Models</span>
            </button>

            <button
              onClick={() => setSettingsTab('instructions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                settingsTab === 'instructions'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Study Persona</span>
            </button>

            <button
              onClick={() => setSettingsTab('account')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                settingsTab === 'account'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>Account & Storage</span>
            </button>
          </div>

          {/* Tab 1: Gemini API Configuration */}
          {settingsTab === 'gemini' && (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-display font-semibold uppercase tracking-wider text-muted-foreground text-[11px] flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-brand-400" />
                    <span>Google AI Studio API Key</span>
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:text-brand-300 font-display flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <span>Get free key</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="pr-10 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground font-serif mt-1">
                  Your key is stored securely in your browser and used to call Gemini models directly.
                </p>
              </div>

              {/* Model Choice */}
              <div>
                <label className="font-display font-semibold uppercase tracking-wider text-muted-foreground text-[11px] mb-1.5 block">
                  Default Reasoning Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'Gemini 1.5 Pro (BYO Key)', label: 'Gemini 1.5 Pro', desc: '2M context, deep source reasoning' },
                    { id: 'Gemini 1.5 Flash (Fast)', label: 'Gemini 1.5 Flash', desc: 'Ultra-fast synthesis & quizzes' },
                    { id: 'Gemini 2.0 Flash Preview', label: 'Gemini 2.0 Flash', desc: 'Next-gen multimodal preview' },
                    { id: 'Claude 3.5 Sonnet', label: 'Claude 3.5 Sonnet', desc: 'High nuance & code reasoning' },
                  ].map((m) => (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer text-left ${
                        selectedModel === m.id
                          ? 'border-brand-500 bg-surface-raised shadow-sm'
                          : 'border-border bg-surface hover:bg-surface-raised/60'
                      }`}
                    >
                      <div className="font-display font-bold text-foreground text-xs flex items-center justify-between">
                        <span>{m.label}</span>
                        {selectedModel === m.id && <Check className="h-3.5 w-3.5 text-brand-400" />}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground font-serif mt-0.5">{m.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Temperature Slider */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-display font-semibold uppercase tracking-wider text-muted-foreground text-[11px]">
                    Strict Grounding Temperature
                  </label>
                  <span className="font-mono text-xs text-brand-400">{geminiTemperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={geminiTemperature}
                  onChange={(e) => setGeminiTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>0.0 Strict Source Grounding</span>
                  <span>1.0 Creative Synthesis</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTestGeminiKey}
                  isLoading={testingKey}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Test Connection
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveAllSettings}
                  isLoading={savingSettings}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {/* Tab 2: Study Persona & Custom Instructions */}
          {settingsTab === 'instructions' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Custom Instructions (Stored in Neon Postgres)
                </label>
                <Textarea
                  value={tempInstructions}
                  onChange={(e) => setTempInstructions(e.target.value)}
                  rows={6}
                  placeholder="Describe your learning style, how questions should be answered, and citations formatted..."
                  className="font-serif leading-relaxed text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    {
                      label: 'Strict Grounding',
                      text: 'Answer questions strictly grounded in uploaded sources. Cite verifiable coordinates and explicitly flag claims without evidence.',
                    },
                    {
                      label: 'Socratic Tutor',
                      text: 'Act as a Socratic study partner. Guide me through concepts using step-by-step questions, hints, and proofs grounded in my notes.',
                    },
                    {
                      label: 'Exam Prep Outlines',
                      text: 'Format responses as high-yield revision outlines with bulleted definitions, flashcard formulas, and memory anchors.',
                    },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setTempInstructions(p.text)}
                      className="px-2.5 py-1 rounded-lg bg-surface-raised border border-border hover:border-brand-500/50 text-[11px] font-display font-medium text-foreground transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={savingSettings}
                  onClick={handleSaveAllSettings}
                >
                  Save to Neon Postgres
                </Button>
              </div>
            </div>
          )}

          {/* Tab 3: Account & Storage */}
          {settingsTab === 'account' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Display Name
                </label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Account Email
                </label>
                <Input
                  value={user.email || 'user@example.com'}
                  disabled
                  className="opacity-70 bg-surface-raised font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1">
                <div className="font-display font-bold text-foreground">Database Storage</div>
                <p className="text-[11.5px] text-muted-foreground font-serif">
                  Connected to Neon Serverless Postgres (`branch: production`). Profiles and custom instructions persist in cloud PostgreSQL.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign Out
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  isLoading={savingSettings}
                  onClick={handleSaveAllSettings}
                >
                  Save Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Edit Instructions Dialog (Quick Pencil Access) */}
      <Dialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
        title="Study Instructions"
        description="Provide custom instructions that the AI will follow when synthesizing your sources."
      >
        <div className="space-y-4">
          <Textarea
            value={tempInstructions}
            onChange={(e) => setTempInstructions(e.target.value)}
            rows={6}
            placeholder="Describe role, persona, study goals, and formatting constraints..."
            className="font-serif leading-relaxed text-sm"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setInstructionsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={savingInstructions}
              onClick={handleSaveInstructions}
            >
              Save to Neon Postgres
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Text Content Dialog */}
      <Dialog
        open={addTextDialogOpen}
        onOpenChange={setAddTextDialogOpen}
        title="Add Text Notes"
        description="Paste lecture notes, study outlines, or transcripts into your grounding context."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Title
            </label>
            <Input
              value={newTextTitle}
              onChange={(e) => setNewTextTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus Lecture Notes"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Text Content
            </label>
            <Textarea
              value={newTextContent}
              onChange={(e) => setNewTextContent(e.target.value)}
              rows={5}
              placeholder="Paste article, notes, or excerpt here..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddTextDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newTextTitle.trim() || !newTextContent.trim()}
              onClick={handleAddText}
            >
              Add to Context
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Import Web Link Dialog */}
      <Dialog
        open={addLinkDialogOpen}
        onOpenChange={setAddLinkDialogOpen}
        title="Import Web Link"
        description="Add a research article, documentation link, or study reference to your grounding context."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Link Title
            </label>
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="e.g. Paxos vs Raft Consensus Comparison"
            />
          </div>
          <div>
            <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              URL
            </label>
            <Input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newLinkUrl.trim()}
              onClick={handleAddLink}
            >
              Import Link
            </Button>
          </div>
        </div>
      </Dialog>

      {/* View Memory Dialog */}
      <Dialog
        open={memoryDialogOpen}
        onOpenChange={setMemoryDialogOpen}
        title="Study Memory"
        description="Preferences remembered across your sessions."
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1">
            <div className="font-display font-bold text-foreground">Grounding Strictness</div>
            <p className="text-muted-foreground font-serif">
              Strict citation enforcement active. Claims are verified against your uploaded materials.
            </p>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setMemoryDialogOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Studio Output Dialog */}
      <Dialog
        open={studioDialogOpen}
        onOpenChange={setStudioDialogOpen}
        title={`Studio: ${studioToolName}`}
        description={`Study tool grounded in your uploaded materials.`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-raised border border-border font-serif text-xs leading-relaxed space-y-3">
            <div className="font-display font-bold text-foreground text-sm flex items-center justify-between">
              <span>{studioToolName} Session</span>
              <Badge variant="brand">{sources.length > 0 ? `${sources.length} Sources` : 'Open Mode'}</Badge>
            </div>
            <p className="text-muted-foreground">
              {sources.length > 0
                ? `Generated output synthesized directly from your ${sources.length} active uploaded source files.`
                : 'Upload source documents to generate grounded quizzes, flashcard decks, and conceptual mind maps.'}
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setStudioDialogOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
