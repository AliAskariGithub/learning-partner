'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  PanelLeftClose,
  Search,
  Settings,
  AlertTriangle,
  Folder,
  Globe,
  HelpCircle,
  Key,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  LogOut,
  Brain,
  Info,
  Sparkles,
  Command,
  Check,
} from 'lucide-react';
import { Button, Input, Dialog, Tooltip, GlidingHighlight } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { Notebook } from '@/db/schema';
import { authClient } from '@/lib/auth/client';
import {
  createNotebook,
  updateNotebook,
  deleteNotebook,
} from '@/app/app/notebook-actions';
import { updateProfileSettings } from '@/app/settings/actions';

interface NotebookSidebarProps {
  notebooks: Notebook[];
  activeNotebookId?: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onOpenSettings: () => void;
  userDisplayName: string;
  userEmail?: string;
  userAvatarUrl?: string | null;
  initialLanguage?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
];

export function NotebookSidebar({
  notebooks,
  activeNotebookId,
  sidebarOpen,
  setSidebarOpen,
  onOpenSettings,
  userDisplayName,
  userEmail,
  userAvatarUrl,
  initialLanguage = 'en',
}: NotebookSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredNotebookId, setHoveredNotebookId] = useState<string | null>(null);

  // User Popover Menu State
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredUserMenuItem, setHoveredUserMenuItem] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Language Picker Dialog State
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [savingLanguage, setSavingLanguage] = useState(false);

  useEffect(() => {
    if (initialLanguage) {
      setCurrentLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  // Help & Shortcuts Dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  // About Learning Partner Dialog
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);

  // Create notebook dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename notebook dialog
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [notebookToRename, setNotebookToRename] = useState<Notebook | null>(null);
  const [renamedTitle, setRenamedTitle] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete notebook confirm dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Click outside to close user menu popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.href = '/sign-in';
    } catch (err: any) {
      toast({
        title: 'Error signing out',
        description: err.message,
        variant: 'error',
      });
    }
  };

  // Language selection handler
  const handleSelectLanguage = async (code: string) => {
    setCurrentLanguage(code);
    setSavingLanguage(true);
    try {
      const fd = new FormData();
      fd.append('preferredLanguage', code);
      await updateProfileSettings(fd);
      setLanguageDialogOpen(false);
      const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === code);
      toast({
        title: 'Language Updated',
        description: `Study language set to ${langObj?.name || code} (${langObj?.native || ''})`,
        variant: 'brand',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error updating language',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSavingLanguage(false);
    }
  };

  // Filter notebooks by search
  const filtered = notebooks.filter((n) =>
    searchQuery
      ? n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.description?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const pinnedNotebooks = filtered.filter((n) => n.pinned);
  const otherNotebooks = filtered.filter((n) => !n.pinned);

  // Handle Create Notebook
  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('title', newTitle.trim());
      fd.append('description', newDescription.trim());

      const created = await createNotebook(fd);
      setNewTitle('');
      setNewDescription('');
      setCreateDialogOpen(false);
      toast({
        title: 'Notebook Created',
        description: created.title,
        variant: 'brand',
      });
      router.push(`/app/notebooks/${created.id}`);
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error creating notebook',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle Rename Notebook
  const handleRename = async () => {
    if (!notebookToRename || !renamedTitle.trim()) return;
    setRenaming(true);
    try {
      await updateNotebook(notebookToRename.id, { title: renamedTitle.trim() });
      setRenameDialogOpen(false);
      setNotebookToRename(null);
      toast({
        title: 'Notebook Renamed',
        description: renamedTitle.trim(),
        variant: 'brand',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error renaming notebook',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setRenaming(false);
    }
  };

  // Handle Delete Notebook
  const handleDelete = async () => {
    if (!notebookToDelete) return;
    setDeleting(true);
    try {
      await deleteNotebook(notebookToDelete.id);
      setDeleteDialogOpen(false);
      setNotebookToDelete(null);
      toast({
        title: 'Notebook Deleted',
        variant: 'neutral',
      });
      router.push('/app');
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error deleting notebook',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle Toggle Pin
  const handleTogglePin = async (notebook: Notebook, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateNotebook(notebook.id, { pinned: !notebook.pinned });
      toast({
        title: notebook.pinned ? 'Unpinned' : 'Pinned to Top',
        description: notebook.title,
        variant: 'neutral',
      });
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error updating pin',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const activeLangObj = SUPPORTED_LANGUAGES.find(
    (l) => l.code === currentLanguage || l.name.toLowerCase() === currentLanguage?.toLowerCase()
  );

  return (
    <>
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="h-full bg-surface border-r border-[#303030] flex flex-col shrink-0 select-none overflow-hidden z-30"
          >
            {/* Top Brand Header: Matches h-14 border-b border-[#303030] across all 3 panels */}
            <div className="h-14 px-4 border-b border-[#303030] flex items-center justify-between shrink-0 bg-surface">
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

            {/* Sidebar Scrollable Body */}
            <div className="flex flex-col flex-1 p-3 overflow-hidden min-h-0 justify-between">
              {/* Primary Action Button: + New Notebook */}
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="primary"
                size="sm"
                className="w-full mb-3 font-display font-bold text-xs h-9 justify-start px-3 shadow-brand-600/20"
              >
                <Plus className="h-3.5 w-3.5 mr-2" />
                New Notebook
              </Button>

              {/* Search Notebooks */}
              <div className="relative mb-3 px-1">
                <Search className="h-3.5 w-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notebooks..."
                  className="w-full bg-surface-raised border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 font-sans"
                />
              </div>

              {/* Scrollable Notebooks List */}
              <div
                className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-border overscroll-contain"
                data-lenis-prevent
                onMouseLeave={() => setHoveredNotebookId(null)}
              >
                {/* 1. Pinned Notebooks */}
                {pinnedNotebooks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 px-2 mb-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground/70">
                      <Pin className="h-3 w-3 text-brand-400" />
                      <span>Pinned Notebooks</span>
                    </div>

                    <div className="space-y-1 relative">
                      {pinnedNotebooks.map((nb) => {
                        const isActive = activeNotebookId === nb.id;
                        return (
                          <div
                            key={nb.id}
                            className="relative"
                            onMouseEnter={() => setHoveredNotebookId(nb.id)}
                          >
                            <GlidingHighlight
                              activeId={isActive ? nb.id : null}
                              hoverId={hoveredNotebookId}
                              itemId={nb.id}
                              layoutId="notebooks-sidebar-glide"
                              className={
                                isActive
                                  ? 'bg-brand-500/15 border border-brand-500/40'
                                  : 'bg-[#262626] border border-[#383838]'
                              }
                            />
                            <div
                              onClick={() => router.push(`/app/notebooks/${nb.id}`)}
                              className={`group relative z-10 flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                                isActive
                                  ? 'text-brand-300 font-semibold'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <BookOpen className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                                <span className="truncate font-serif">{nb.title}</span>
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip content="Unpin notebook" side="top">
                                  <button
                                    onClick={(e) => handleTogglePin(nb, e)}
                                    className="p-1 text-muted-foreground hover:text-brand-400 transition cursor-pointer"
                                  >
                                    <Pin className="h-3 w-3 fill-brand-400/30" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Rename notebook" side="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotebookToRename(nb);
                                      setRenamedTitle(nb.title);
                                      setRenameDialogOpen(true);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete notebook" side="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotebookToDelete(nb);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-error transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. All Other Notebooks */}
                <div>
                  <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground/70">
                    <span>Notebooks ({notebooks.length})</span>
                  </div>

                  <div className="space-y-1 relative">
                    {otherNotebooks.length === 0 && pinnedNotebooks.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground/80 font-serif">
                        No notebooks found.
                      </div>
                    ) : (
                      otherNotebooks.map((nb) => {
                        const isActive = activeNotebookId === nb.id;
                        return (
                          <div
                            key={nb.id}
                            className="relative"
                            onMouseEnter={() => setHoveredNotebookId(nb.id)}
                          >
                            <GlidingHighlight
                              activeId={isActive ? nb.id : null}
                              hoverId={hoveredNotebookId}
                              itemId={nb.id}
                              layoutId="notebooks-sidebar-glide"
                              className={
                                isActive
                                  ? 'bg-brand-500/15 border border-brand-500/40'
                                  : 'bg-[#262626] border border-[#383838]'
                              }
                            />
                            <div
                              onClick={() => router.push(`/app/notebooks/${nb.id}`)}
                              className={`group relative z-10 flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                                isActive
                                  ? 'text-brand-300 font-semibold'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-1">
                                <Folder className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-brand-400' : 'text-muted-foreground'}`} />
                                <span className="truncate font-serif">{nb.title}</span>
                              </div>

                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Tooltip content="Pin to top" side="top">
                                  <button
                                    onClick={(e) => handleTogglePin(nb, e)}
                                    className="p-1 text-muted-foreground hover:text-brand-400 transition cursor-pointer"
                                  >
                                    <Pin className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Rename notebook" side="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotebookToRename(nb);
                                      setRenamedTitle(nb.title);
                                      setRenameDialogOpen(true);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-foreground transition cursor-pointer"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete notebook" side="top">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setNotebookToDelete(nb);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="p-1 text-muted-foreground hover:text-error transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* ---------------------------------------------------------------- */}
              {/* Bottom User Button & Upward Popover Menu                          */}
              {/* ---------------------------------------------------------------- */}
              <div className="relative pt-2 border-t border-border mt-auto" ref={userMenuRef}>
                {/* Popover Menu opening upward */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-border bg-[#262626] shadow-2xl p-1.5 text-xs z-50 overflow-hidden"
                    >
                      {/* User Email Header with Avatar */}
                      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-border/60 mb-1 select-none font-sans">
                        {userAvatarUrl ? (
                          <img
                            src={userAvatarUrl}
                            alt={userDisplayName}
                            className="w-7 h-7 rounded-full object-cover border border-brand-500/40 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-surface-raised border border-border text-brand-400 flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-sm">
                            {userDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-display font-semibold text-foreground truncate">
                            {userDisplayName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            {userEmail || 'Scholar'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-0.5 relative" onMouseLeave={() => setHoveredUserMenuItem(null)}>
                        {/* 1. Settings - Takes directly to user profile */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('settings')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="settings"
                            layoutId="user-popover-item"
                            className="bg-[#191919] border border-[#383838]"
                          />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              router.push('/settings');
                            }}
                            className="relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-foreground transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Settings className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                              <span className="font-display font-medium">Settings</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">Profile &amp; Keys</span>
                          </button>
                        </div>

                        {/* 2. Language - Opens Language Selector Dialog */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('language')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="language"
                            layoutId="user-popover-item"
                            className="bg-[#191919] border border-[#383838]"
                          />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setLanguageDialogOpen(true);
                            }}
                            className="relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-foreground transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                              <span className="font-display font-medium">Language</span>
                            </div>
                            <span className="text-[10px] text-brand-400 font-medium">
                              {activeLangObj?.native || 'English'}
                            </span>
                          </button>
                        </div>

                        {/* 3. Get API keys (Google AI Studio) */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('api-keys')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="api-keys"
                            layoutId="user-popover-item"
                            className="bg-[#191919] border border-[#383838]"
                          />
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setUserMenuOpen(false)}
                            className="relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-foreground transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Key className="w-4 h-4 text-brand-400 group-hover:text-brand-300 transition-colors" />
                              <span className="font-display font-medium">Get API keys</span>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brand-400 transition-colors" />
                          </a>
                        </div>

                        {/* 4. Get Help & Shortcuts */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('help')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="help"
                            layoutId="user-popover-item"
                            className="bg-[#191919] border border-[#383838]"
                          />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setHelpDialogOpen(true);
                            }}
                            className="relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-foreground transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <HelpCircle className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                              <span className="font-display font-medium">Help &amp; Shortcuts</span>
                            </div>
                          </button>
                        </div>

                        {/* 5. Learn more / About */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('about')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="about"
                            layoutId="user-popover-item"
                            className="bg-[#191919] border border-[#383838]"
                          />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              setAboutDialogOpen(true);
                            }}
                            className="relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-foreground transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-2.5">
                              <Info className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                              <span className="font-display font-medium">About Learning Partner</span>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Divider */}
                        <div className="my-1 border-t border-border/60" />

                        {/* 6. Log out */}
                        <div className="relative w-full" onMouseEnter={() => setHoveredUserMenuItem('logout')}>
                          <GlidingHighlight
                            activeId={null}
                            hoverId={hoveredUserMenuItem}
                            itemId="logout"
                            layoutId="user-popover-item"
                            className="bg-red-950/40 border border-red-500/30"
                          />
                          <button
                            onClick={handleSignOut}
                            className="relative z-10 w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[#f87171] transition-colors cursor-pointer group"
                          >
                            <LogOut className="w-4 h-4 text-[#f87171] group-hover:translate-x-0.5 transition-transform" />
                            <span className="font-display font-medium">Log out</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* The User Button: Initial Circle or Photo + Display Name + Chevron (Clean without • Free) */}
                <div className="flex items-center justify-between gap-1">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-raised transition-colors cursor-pointer flex-1 min-w-0 text-left group"
                  >
                    {/* Circle Avatar with Image or Initial */}
                    {userAvatarUrl ? (
                      <img
                        src={userAvatarUrl}
                        alt={userDisplayName}
                        className="w-7 h-7 rounded-full object-cover border border-border shrink-0 shadow-sm group-hover:border-brand-500/40 transition-colors"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-raised border border-border text-brand-400 flex items-center justify-center font-display font-bold text-xs shrink-0 shadow-sm group-hover:border-brand-500/40 transition-colors">
                        {userDisplayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Display Name and Animated Chevron */}
                    <div className="flex items-center justify-between min-w-0 flex-1 pr-1">
                      <span className="text-xs font-display font-semibold text-foreground truncate group-hover:text-brand-300 transition-colors">
                        {userDisplayName}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          userMenuOpen ? 'rotate-180 text-brand-400' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Collapse Sidebar Button on the Right */}
                  <Tooltip content="Collapse sidebar" side="top">
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer shrink-0"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Dialog: Language Picker */}
      <Dialog
        open={languageDialogOpen}
        onOpenChange={setLanguageDialogOpen}
        title="Select Preferred Study Language"
        description="Choose your primary language for study materials, summaries, and AI grounded reasoning."
      >
        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-border">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelectLanguage(lang.code)}
                  disabled={savingLanguage}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-display transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500 text-foreground font-semibold shadow-sm'
                      : 'bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-raised hover:border-brand-500/30'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-foreground font-semibold">{lang.name}</span>
                    <span className="text-[10px] text-muted-foreground">{lang.native}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguageDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Create New Notebook */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        title="Create New Study Notebook"
        description="Organize your research sources, notes, and study sessions."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Notebook Title
            </label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Distributed Consensus &amp; Cloud Storage"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Description (Optional)
            </label>
            <Input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="One-line summary of what you are studying..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={creating || !newTitle.trim()}
            >
              {creating ? 'Creating...' : 'Create Notebook'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Rename Notebook */}
      <Dialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        title="Rename Notebook"
        description="Update the display name of this notebook."
      >
        <div className="space-y-4">
          <Input
            value={renamedTitle}
            onChange={(e) => setRenamedTitle(e.target.value)}
            placeholder="Notebook title"
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => setRenameDialogOpen(false)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRename}
              disabled={renaming || !renamedTitle.trim()}
            >
              {renaming ? 'Saving...' : 'Rename'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Delete Notebook Confirm */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Notebook"
        description={`Are you sure you want to delete "${notebookToDelete?.title}"? All uploaded sources, indexed chunks, and saved notes inside will be permanently deleted.`}
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Notebook'}
          </Button>
        </div>
      </Dialog>

      {/* Dialog: Help & Shortcuts */}
      <Dialog
        open={helpDialogOpen}
        onOpenChange={setHelpDialogOpen}
        title="Learning Partner Shortcuts &amp; Help"
        description="Keyboard shortcuts and workflow tips for source-grounded research."
      >
        <div className="space-y-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-display font-medium text-foreground">Open Profile &amp; Settings</span>
              <kbd className="px-2 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono text-muted-foreground">
                Settings
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display font-medium text-foreground">Send Chat Message</span>
              <kbd className="px-2 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono text-muted-foreground">
                Enter
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display font-medium text-foreground">Multiline Prompt</span>
              <kbd className="px-2 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono text-muted-foreground">
                Shift + Enter
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-display font-medium text-foreground">Close Popovers &amp; Dialogs</span>
              <kbd className="px-2 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono text-muted-foreground">
                Esc
              </kbd>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="primary" onClick={() => setHelpDialogOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: About Learning Partner */}
      <Dialog
        open={aboutDialogOpen}
        onOpenChange={setAboutDialogOpen}
        title="About Learning Partner"
        description="Free, open source-grounded study workspace powered by Neon &amp; Google Gemini."
      >
        <div className="space-y-3 pt-2 text-xs font-serif leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground font-display">Learning Partner v1.0</strong> is an open-source alternative to Google NotebookLM, designed with Claude-inspired focus and NotebookLM multi-source synthesis.
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Strict source-grounded reasoning with inline citations.</li>
            <li>Multi-format ingestion: PDFs (with page numbers), DOCX, Web URLs, and raw notes.</li>
            <li>PostgreSQL vector retrieval via pgvector &amp; full-text tsvector GIN indexing.</li>
            <li>Bring your own Google Gemini API keys (Free tier supported).</li>
          </ul>
          <div className="flex justify-end pt-2">
            <Button size="sm" variant="primary" onClick={() => setAboutDialogOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
