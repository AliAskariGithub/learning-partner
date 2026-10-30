'use client';

import React, { useState } from 'react';
import { Notebook, Source, Note, StudioOutput } from '@/db/schema';
import {
  Pin,
  Pencil,
  Plus,
  Mic,
  ArrowUp,
  ArrowRight,
  FileText,
  BookOpen,
  Trash2,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Clock,
  Layout,
  Layers,
} from 'lucide-react';
import { Button, Input, Textarea, Dialog, Badge } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import {
  updateNotebook,
  createNote,
  updateNote,
  deleteNote,
} from '@/app/app/notebook-actions';

interface NotebookHomeViewProps {
  notebook: Notebook;
  sources: Source[];
  notes: Note[];
  outputs?: StudioOutput[];
  onOpenAddSource: () => void;
  onOpenSourceViewer: (source: Source) => void;
  onSwitchToWorkspace: () => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

export function NotebookHomeView({
  notebook,
  sources,
  notes,
  outputs = [],
  onOpenAddSource,
  onOpenSourceViewer,
  onSwitchToWorkspace,
  hasApiKey,
  onOpenSettings,
}: NotebookHomeViewProps) {
  const { toast } = useToast();

  // Inline Title & Description Editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isPinned, setIsPinned] = useState(notebook.pinned);

  // Input Card State
  const [prompt, setPrompt] = useState('');
  const promptBeforeSpeechRef = React.useRef('');
  const { isListening: isVoiceListening, toggleListening: toggleVoiceListening } = useSpeechToText({
    onTranscript: (transcript) => {
      const base = promptBeforeSpeechRef.current.trim();
      setPrompt(base ? `${base} ${transcript}` : transcript);
    },
  });

  const handleToggleVoice = () => {
    if (!isVoiceListening) {
      promptBeforeSpeechRef.current = prompt;
    }
    toggleVoiceListening();
  };
  const [mode, setMode] = useState<'chat' | 'learn' | 'quiz'>('chat');
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro (BYO Key)');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Instructions Dialog
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [instructionsText, setInstructionsText] = useState(
    notebook.instructions ||
      'ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.'
  );
  const [savingInstructions, setSavingInstructions] = useState(false);

  // Notes Dialogs
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Edit Note Dialog
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');

  // Save Inline Title
  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    if (!title.trim() || title === notebook.title) return;
    try {
      await updateNotebook(notebook.id, { title: title.trim() });
      toast({ title: 'Title Updated', description: title.trim(), variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  // Save Inline Description
  const handleSaveDesc = async () => {
    setIsEditingDesc(false);
    if (description === notebook.description) return;
    try {
      await updateNotebook(notebook.id, { description: description.trim() || undefined });
      toast({ title: 'Description Updated', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  // Toggle Pin
  const handleTogglePin = async () => {
    const next = !isPinned;
    setIsPinned(next);
    try {
      await updateNotebook(notebook.id, { pinned: next });
      toast({
        title: next ? 'Notebook Pinned' : 'Notebook Unpinned',
        variant: 'success',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  // Save Instructions to Notebook
  const handleSaveInstructions = async () => {
    setSavingInstructions(true);
    try {
      await updateNotebook(notebook.id, { instructions: instructionsText.trim() });
      setInstructionsDialogOpen(false);
      toast({
        title: 'Instructions Saved',
        description: 'Notebook custom persona updated in Neon Postgres.',
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    } finally {
      setSavingInstructions(false);
    }
  };

  // Create Note
  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;
    setSavingNote(true);
    try {
      await createNote(notebook.id, newNoteTitle.trim(), newNoteContent.trim());
      setNewNoteTitle('');
      setNewNoteContent('');
      setAddNoteDialogOpen(false);
      toast({ title: 'Note Saved', description: 'Added to notebook memory.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error saving note', description: err.message, variant: 'error' });
    } finally {
      setSavingNote(false);
    }
  };

  // Save Edited Note
  const handleUpdateNote = async () => {
    if (!editingNote || !editNoteTitle.trim()) return;
    setSavingNote(true);
    try {
      await updateNote(editingNote.id, editNoteTitle.trim(), editNoteContent.trim());
      setEditingNote(null);
      toast({ title: 'Note Updated', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    } finally {
      setSavingNote(false);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast({ title: 'Note Deleted', variant: 'neutral' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  const enabledSourcesCount = sources.filter((s) => s.enabled && s.status === 'ready').length;

  return (
    <div className="flex-1 flex overflow-hidden w-full h-full bg-background">
      {/* Center Column: Claude Projects Style Home (max-w-3xl or max-w-4xl) */}
      <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-12 flex flex-col items-center" data-lenis-prevent>
        <div className="w-full max-w-3xl flex flex-col flex-1">
          {/* Top Title & Inline Description Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                  className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground bg-transparent border-b border-brand-500 outline-none w-full"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground hover:text-brand-300 transition cursor-pointer flex items-center gap-2 group"
                  title="Click to edit notebook title"
                >
                  <span>{title}</span>
                  <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-70 transition-opacity" />
                </h1>
              )}

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleTogglePin}
                  className={`p-2 rounded-xl border border-border transition cursor-pointer ${
                    isPinned
                      ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
                  }`}
                  title={isPinned ? 'Unpin notebook' : 'Pin notebook'}
                >
                  <Pin className={`h-4 w-4 ${isPinned ? 'fill-brand-400/30' : ''}`} />
                </button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSwitchToWorkspace}
                  className="text-xs font-display font-semibold"
                  title="Open NotebookLM 3-panel study workspace"
                >
                  <Layout className="h-3.5 w-3.5 mr-1.5 text-brand-400" />
                  <span>3-Panel Workspace</span>
                </Button>
              </div>
            </div>

            {/* One-line Description */}
            {isEditingDesc ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveDesc}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveDesc()}
                autoFocus
                placeholder="Add a one-line description..."
                className="text-sm text-muted-foreground font-serif bg-transparent border-b border-border outline-none w-full py-1"
              />
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                className="text-sm text-muted-foreground font-serif leading-relaxed hover:text-foreground transition cursor-pointer"
                title="Click to edit description"
              >
                {description || 'Add a one-line research description...'}
              </p>
            )}
          </div>

          {/* Large Rounded Input Card */}
          <div className="rounded-2xl border border-border bg-surface shadow-xl p-3 mb-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask anything about your sources, or request a study summary..."
              className="w-full bg-transparent border-0 outline-none resize-none text-[15px] text-foreground placeholder:text-muted-foreground/60 min-h-[90px] p-2 font-serif leading-relaxed"
            />

            {/* Bottom Toolbar of the Input Card */}
            <div className="flex items-center justify-between pt-2 px-1 border-t border-border/40">
              {/* Left controls: + Source button, Mode toggle pills (Chat / Learn / Quiz) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAddSource}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer border border-border/60 hover:border-border flex items-center justify-center"
                  title="Add sources to notebook"
                >
                  <Plus className="h-4 w-4" />
                </button>

                <div className="flex items-center bg-surface-raised rounded-xl p-0.5 border border-border text-xs font-display font-bold">
                  {(['chat', 'learn', 'quiz'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1 rounded-lg transition capitalize cursor-pointer ${
                        mode === m
                          ? 'bg-surface text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-muted-foreground/80 pl-1">
                  {enabledSourcesCount} sources active
                </span>
              </div>

              {/* Right controls: Model Selector, Mic, Send */}
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
                    <div className="absolute right-0 bottom-full mb-2 w-56 rounded-2xl bg-surface border border-border p-1.5 shadow-2xl z-50 text-xs font-display">
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
                            setModelDropdownOpen(false);
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-left text-muted-foreground hover:bg-surface-raised hover:text-foreground transition cursor-pointer"
                        >
                          <span>{m}</span>
                          {selectedModel === m && <CheckCircle2 className="h-3.5 w-3.5 text-brand-400" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`p-2 rounded-xl transition cursor-pointer border ${
                    isVoiceListening
                      ? 'text-rose-400 bg-rose-500/20 border-rose-500/40 shadow-lg shadow-rose-500/20 animate-pulse'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised border-border/60 hover:border-border'
                  }`}
                  title={isVoiceListening ? 'Listening... Click to stop' : 'Voice input'}
                  aria-label={isVoiceListening ? 'Stop voice input' : 'Start voice input'}

                >
                  <Mic className={`h-4 w-4 ${isVoiceListening ? 'text-rose-400' : ''}`} />
                </button>

                {/* Send button with disabled state and tooltip if no API key */}
                <div className="relative group">
                  <button
                    disabled={!prompt.trim() || !hasApiKey}
                    onClick={() => {
                      if (!hasApiKey) {
                        onOpenSettings();
                        return;
                      }
                      toast({
                        title: 'Prompt Grounding',
                        description: `Grounded in ${enabledSourcesCount} sources. (Phase 3 AI wiring)`,
                        variant: 'success',
                      });
                      setPrompt('');
                    }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      prompt.trim() && hasApiKey
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 hover:bg-brand-500 cursor-pointer'
                        : 'bg-surface-raised text-muted-foreground/40 cursor-not-allowed border border-border'
                    }`}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>

                  {!hasApiKey && (
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 rounded-xl bg-surface-raised border border-border shadow-xl text-[11px] text-muted-foreground font-sans pointer-events-none z-50 text-center">
                      Add a Gemini API key in Settings to start chatting
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recents List for Chats & Generated Outputs */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
                Recents
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {outputs.length} {outputs.length === 1 ? 'output' : 'outputs'}
              </span>
            </div>

            {outputs.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border/80 text-center text-muted-foreground">
                <Clock className="h-6 w-6 mx-auto mb-2 opacity-40 text-brand-400" />
                <p className="text-xs font-serif leading-relaxed text-muted-foreground/80">
                  No recent conversations or outputs in this notebook yet. Ask a question or use Studio to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {outputs.slice(0, 6).map((out) => (
                  <div
                    key={out.id}
                    onClick={onSwitchToWorkspace}
                    className="p-3.5 rounded-2xl bg-surface-raised border border-border hover:border-brand-500/50 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-display font-bold text-foreground truncate">
                          {out.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {out.type.replace('_', ' ')} · {out.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Column: Three Cards (Instructions, Saved Notes, Sources) */}
      <aside className="w-84 h-full border-l border-border bg-surface p-4 flex flex-col gap-4 overflow-y-auto shrink-0 select-none hidden lg:flex" data-lenis-prevent>
        {/* Card 1: Instructions */}
        <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-brand-400" />
              Instructions
            </span>
            <button
              onClick={() => setInstructionsDialogOpen(true)}
              className="p-1 rounded text-muted-foreground hover:text-brand-400 transition cursor-pointer"
              title="Edit notebook instructions"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-muted-foreground font-serif leading-relaxed line-clamp-3">
            {notebook.instructions || 'No custom instructions set. Click pencil to set persona and tone.'}
          </p>
        </div>

        {/* Card 2: Saved Notes (Project Memory) */}
        <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm flex flex-col max-h-72">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-brand-400" />
              Saved Notes ({notes.length})
            </span>
            <button
              onClick={() => setAddNoteDialogOpen(true)}
              className="p-1 rounded text-muted-foreground hover:text-brand-400 transition cursor-pointer"
              title="Add saved note"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1" data-lenis-prevent>
            {notes.length === 0 ? (
              <p className="text-muted-foreground font-serif text-[11.5px] leading-relaxed">
                Save key takeaways, outlines, and takeaways here to guide memory across sessions.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-xl bg-surface border border-border hover:border-brand-500/40 transition group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display font-semibold text-foreground text-xs truncate">
                      {note.title}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingNote(note);
                          setEditNoteTitle(note.title);
                          setEditNoteContent(note.content);
                        }}
                        className="text-muted-foreground hover:text-foreground p-0.5"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-muted-foreground hover:text-error p-0.5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-muted-foreground font-serif text-[11px] line-clamp-2 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 3: Sources Drag-and-Drop Zone & List */}
        <div className="rounded-2xl border border-border bg-surface-raised p-4 text-xs shadow-sm flex flex-col flex-1 min-h-[260px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-foreground text-sm flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-brand-400" />
              Sources ({sources.length})
            </span>
            <button
              onClick={onOpenAddSource}
              className="w-6 h-6 rounded-lg bg-surface text-brand-400 hover:bg-brand-600 hover:text-white border border-border flex items-center justify-center transition cursor-pointer shadow-sm"
              title="Add source to notebook"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1" data-lenis-prevent>
            {sources.length === 0 ? (
              <div
                onClick={onOpenAddSource}
                className="h-full min-h-[140px] border-2 border-dashed border-border/80 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-500/50 hover:bg-surface/50 transition-colors"
              >
                <Paperclip className="h-6 w-6 text-brand-400 mb-2 opacity-70" />
                <p className="text-xs font-serif text-muted-foreground leading-relaxed px-2">
                  Add PDFs, documents, links or text to reference in this notebook
                </p>
              </div>
            ) : (
              sources.map((s, idx) => (
                <div
                  key={s.id}
                  onClick={() => s.status === 'ready' && onOpenSourceViewer(s)}
                  className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border hover:border-brand-500/50 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="citation-chip shrink-0">[{idx + 1}]</span>
                    <span className="text-xs text-foreground truncate font-serif">{s.title}</span>
                  </div>

                  <Badge
                    variant={
                      s.status === 'ready'
                        ? 'success'
                        : s.status === 'processing'
                        ? 'warning'
                        : s.status === 'failed'
                        ? 'error'
                        : 'neutral'
                    }
                  >
                    {s.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Edit Instructions Dialog */}
      <Dialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
        title="Notebook Study Instructions"
        description="Set the tone, difficulty level, and grounding rules specific to this study notebook."
      >
        <div className="space-y-4">
          <Textarea
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            rows={6}
            placeholder="Describe role, tone, level, and citation constraints..."
            className="font-serif leading-relaxed text-xs"
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
              Save to Notebook
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Saved Note Dialog */}
      <Dialog
        open={addNoteDialogOpen}
        onOpenChange={setAddNoteDialogOpen}
        title="Add Saved Note"
        description="Store memory notes, definitions, or study takeaways in this notebook."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Title
            </label>
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="e.g. Consensus Safety Invariants"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Content
            </label>
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={5}
              placeholder="Key concepts or rules to remember..."
              className="font-serif text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAddNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
              isLoading={savingNote}
              onClick={handleCreateNote}
            >
              Save Note
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog
        open={Boolean(editingNote)}
        onOpenChange={(val) => !val && setEditingNote(null)}
        title="Edit Saved Note"
        description="Update your saved memory notes."
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Title
            </label>
            <Input
              value={editNoteTitle}
              onChange={(e) => setEditNoteTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Content
            </label>
            <Textarea
              value={editNoteContent}
              onChange={(e) => setEditNoteContent(e.target.value)}
              rows={5}
              className="font-serif text-xs leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setEditingNote(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!editNoteTitle.trim()}
              isLoading={savingNote}
              onClick={handleUpdateNote}
            >
              Update Note
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
