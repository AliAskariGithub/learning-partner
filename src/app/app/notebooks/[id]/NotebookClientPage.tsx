'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Notebook, Source, Note, Profile, Conversation, Message, Citation, StudioOutput } from '@/db/schema';
import { NotebookSidebar } from '@/components/workspace/NotebookSidebar';
import { WorkspaceThreePanelView } from '@/components/workspace/WorkspaceThreePanelView';
import { AddSourceDialog } from '@/components/workspace/AddSourceDialog';
import { SourceViewerDialog } from '@/components/workspace/SourceViewerDialog';
import { GeminiSettingsModal } from '@/components/workspace/GeminiSettingsModal';
import { ManageApiKeysDialog } from '@/components/ai/ManageApiKeysDialog';
import { useToast } from '@/components/ui/toast';
import { SafeApiKey, getUserApiKeys } from '@/app/app/api-key-actions';
import { getNotebookOutputs } from '@/app/app/studio-actions';
import {
  getConversations,
  getConversationMessages,
  deleteConversation,
  saveNoteFromMessage,
  deleteMessage,
  updateMessage,
} from '@/app/app/chat-actions';
import {
  toggleSourceEnabled,
  renameSource,
  deleteSource,
  retrySource,
} from '@/app/app/notebook-actions';
import { UnverifiedBanner } from '@/components/auth/UnverifiedBanner';

interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  [key: string]: any;
}

interface NotebookClientPageProps {
  user: AuthUser;
  profile: Profile | null;
  initialNotebook: Notebook;
  initialSources: Source[];
  initialNotes: Note[];
  allNotebooks: Notebook[];
  initialUserKeys?: SafeApiKey[];
  initialConversations?: Conversation[];
  initialMessages?: Message[];
  initialOutputs?: StudioOutput[];
}

export function NotebookClientPage({
  user,
  profile,
  initialNotebook,
  initialSources,
  initialNotes,
  allNotebooks,
  initialUserKeys = [],
  initialConversations = [],
  initialMessages = [],
  initialOutputs = [],
}: NotebookClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Core Data State
  const [notebook, setNotebook] = useState<Notebook>(initialNotebook);
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [outputs, setOutputs] = useState<StudioOutput[]>(initialOutputs);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const refreshOutputs = useCallback(async () => {
    try {
      const fresh = await getNotebookOutputs(notebook.id);
      setOutputs(fresh);
    } catch (err) {
      console.error('Failed to refresh studio outputs:', err);
    }
  }, [notebook.id]);

  // BYOK API Keys & Model State
  const [userKeys, setUserKeys] = useState<SafeApiKey[]>(initialUserKeys);
  const [selectedModelId, setSelectedModelId] = useState<string>(
    notebook.lastModel || 'gemini-3.8-flash'
  );
  const [selectedMode, setSelectedMode] = useState<'chat' | 'learn' | 'quiz'>(
    (initialConversations[0]?.mode as 'chat' | 'learn' | 'quiz') || 'chat'
  );

  // Chat & Conversation State
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id || null
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dialog States
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [sourceViewerSource, setSourceViewerSource] = useState<Source | null>(null);
  const [sourceViewerHighlightChunkId, setSourceViewerHighlightChunkId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [manageKeysOpen, setManageKeysOpen] = useState(false);

  // Refresh user keys from server
  const refreshUserKeys = useCallback(async () => {
    try {
      const keys = await getUserApiKeys();
      setUserKeys(keys);
    } catch (err) {
      console.error('Failed to load user keys:', err);
    }
  }, []);

  // Sync state when props change
  useEffect(() => {
    setNotebook(initialNotebook);
  }, [initialNotebook]);

  useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  // Polling for processing sources
  const hasProcessingSources = sources.some(
    (s) => s.status === 'processing' || s.status === 'pending'
  );

  const fetchLatestSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/notebooks/${notebook.id}/sources`);
      if (res.ok) {
        const data = await res.json();
        if (data?.sources) {
          setSources(data.sources);
        }
      }
    } catch (err) {
      console.error('Failed to poll sources status:', err);
    }
  }, [notebook.id]);

  useEffect(() => {
    if (!hasProcessingSources) return;
    const interval = setInterval(() => {
      fetchLatestSources();
    }, 3500);
    return () => clearInterval(interval);
  }, [hasProcessingSources, fetchLatestSources]);

  // Source Action Handlers
  const handleToggleSourceEnabled = async (sourceId: string, enabled: boolean) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, enabled } : s))
    );
    try {
      await toggleSourceEnabled(sourceId, enabled);
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'error' });
      fetchLatestSources();
    }
  };

  const handleRenameSource = async (source: Source, newTitle: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === source.id ? { ...s, title: newTitle } : s))
    );
    try {
      await renameSource(source.id, newTitle);
    } catch (err: any) {
      toast({ title: 'Rename failed', description: err.message, variant: 'error' });
      fetchLatestSources();
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    try {
      await deleteSource(sourceId);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'error' });
      fetchLatestSources();
    }
  };

  const handleRetrySource = async (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, status: 'processing', errorMessage: null } : s))
    );
    try {
      await retrySource(sourceId);
      toast({
        title: 'Retrying Ingestion',
        description: 'Processing source in background...',
        variant: 'brand',
      });
    } catch (err: any) {
      toast({ title: 'Retry failed', description: err.message, variant: 'error' });
      fetchLatestSources();
    }
  };

  // Chat Handlers
  const handleSelectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setSelectedModelId(conv.model);
      setSelectedMode(conv.mode as 'chat' | 'learn' | 'quiz');
    }
    try {
      const msgs = await getConversationMessages(convId);
      setMessages(msgs);
    } catch (err: any) {
      toast({ title: 'Error loading conversation', description: err.message, variant: 'error' });
    }
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setStreamingCitations([]);
  };

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId, notebook.id);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        handleNewConversation();
      }
      toast({ title: 'Conversation deleted', variant: 'neutral' });
    } catch (err: any) {
      toast({ title: 'Error deleting conversation', description: err.message, variant: 'error' });
    }
  };

  const handleSendMessage = async (prompt: string, modelId: string, mode: 'chat' | 'learn' | 'quiz') => {
    if (!prompt.trim() || isStreaming) return;

    const userMsgId = 'temp-user-' + Date.now();
    const optimisticUserMessage: Message = {
      id: userMsgId,
      conversationId: activeConversationId || 'pending',
      role: 'user',
      content: prompt.trim(),
      citations: null,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingCitations([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebookId: notebook.id,
          conversationId: activeConversationId,
          message: prompt.trim(),
          modelId,
          mode,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.code === 'KEY_MISSING') {
          setManageKeysOpen(true);
        }
        throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
      }

      const convIdHeader = res.headers.get('x-conversation-id');
      const citationsHeader = res.headers.get('x-citations');
      let parsedCitations: Citation[] = [];

      if (citationsHeader) {
        try {
          parsedCitations = JSON.parse(decodeURIComponent(citationsHeader));
          setStreamingCitations(parsedCitations);
        } catch (e) {
          console.warn('Failed to parse citations header:', e);
        }
      }

      if (convIdHeader && convIdHeader !== activeConversationId) {
        setActiveConversationId(convIdHeader);
        getConversations(notebook.id).then(setConversations).catch(() => {});
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream received.');

      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setStreamingContent(accumulatedText);
      }

      if (!accumulatedText.trim()) {
        throw new Error('The AI model finished without generating any text. Please verify your API key and model selection.');
      }

      const assistantMsg: Message = {
        id: 'assistant-' + Date.now(),
        conversationId: convIdHeader || activeConversationId || 'pending',
        role: 'assistant',
        content: accumulatedText,
        citations: parsedCitations,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setStreamingContent('');
      getConversations(notebook.id).then(setConversations).catch(() => {});
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (streamingContent.trim()) {
          const partialMsg: Message = {
            id: 'assistant-aborted-' + Date.now(),
            conversationId: activeConversationId || 'pending',
            role: 'assistant',
            content: streamingContent + ' *(Response stopped)*',
            citations: streamingCitations,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, partialMsg]);
        }
      } else {
        toast({ title: 'Chat Error', description: err.message, variant: 'error' });
        const errorMsg: Message = {
          id: 'error-' + Date.now(),
          conversationId: activeConversationId || 'pending',
          role: 'assistant',
          content: `⚠️ **Unable to complete response**\n\n${err.message}`,
          citations: null,
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCitationClick = (citation: Citation) => {
    const matchingSource = sources.find((s) => s.id === citation.sourceId);
    if (matchingSource) {
      setSourceViewerSource(matchingSource);
      setSourceViewerHighlightChunkId(citation.chunkId);
    } else {
      toast({
        title: 'Citation Source',
        description: `${citation.sourceTitle}${citation.pageNumber ? ` (Page ${citation.pageNumber})` : ''}`,
        variant: 'brand',
      });
    }
  };

  const handleSaveNoteFromMessage = async (content: string, title?: string) => {
    try {
      const saved = await saveNoteFromMessage({
        notebookId: notebook.id,
        title: title || 'Saved Insight',
        content,
      });
      setNotes((prev) => [saved, ...prev]);
      toast({
        title: 'Saved to Notebook Notes',
        description: 'Insight added to project memory.',
        variant: 'brand',
      });
    } catch (err: any) {
      toast({ title: 'Error saving note', description: err.message, variant: 'error' });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const idx = messages.findIndex((m) => m.id === messageId);
      if (idx === -1) return;

      const userMsg = messages[idx];
      const nextMsg = messages[idx + 1];
      const assistantMsg =
        userMsg.role === 'user' && nextMsg && nextMsg.role === 'assistant' ? nextMsg : null;

      const idsToDelete = [userMsg.id];
      if (assistantMsg) {
        idsToDelete.push(assistantMsg.id);
      }

      setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));

      for (const id of idsToDelete) {
        if (!id.startsWith('temp-') && !id.startsWith('assistant-') && !id.startsWith('error-')) {
          await deleteMessage(id).catch(() => {});
        }
      }

      toast({
        title: assistantMsg ? 'User prompt and response deleted' : 'Message deleted',
        variant: 'brand',
      });
    } catch (err: any) {
      toast({ title: 'Error deleting message', description: err.message, variant: 'error' });
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: newContent } : m))
      );
      if (!messageId.startsWith('temp-')) {
        await updateMessage(messageId, newContent);
      }
      toast({ title: 'Message updated', variant: 'brand' });
    } catch (err: any) {
      toast({ title: 'Error updating message', description: err.message, variant: 'error' });
    }
  };

  const handleResendMessage = async (messageId: string, promptContent?: string) => {
    try {
      const idx = messages.findIndex((m) => m.id === messageId);
      const userMsg = idx !== -1 ? messages[idx] : null;
      const contentToSend = promptContent || userMsg?.content;
      if (!contentToSend) return;

      const nextMsg = idx !== -1 ? messages[idx + 1] : null;
      const assistantMsg =
        userMsg?.role === 'user' && nextMsg && nextMsg.role === 'assistant' ? nextMsg : null;

      // Delete the old user message AND its generated response
      const idsToDelete: string[] = [];
      if (userMsg) idsToDelete.push(userMsg.id);
      if (assistantMsg) idsToDelete.push(assistantMsg.id);

      setMessages((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));

      for (const id of idsToDelete) {
        if (!id.startsWith('temp-') && !id.startsWith('assistant-') && !id.startsWith('error-')) {
          await deleteMessage(id).catch(() => {});
        }
      }

      // Re-send the prompt to regenerate response!
      await handleSendMessage(contentToSend, selectedModelId, selectedMode);
    } catch (err: any) {
      toast({ title: 'Error resending prompt', description: err.message, variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#191919] text-[#f4f4f2]">
      {/* Top Red Alert Notification when user is not verified */}
      <UnverifiedBanner email={user.email || ''} isVerified={Boolean(user.emailVerified)} />

      <div className="flex flex-1 w-full overflow-hidden min-h-0">
        {/* Notebooks Sidebar (pinned first, list, add, rename, delete) */}
        <NotebookSidebar
          notebooks={allNotebooks}
          activeNotebookId={notebook.id}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenSettings={() => setSettingsOpen(true)}
          userDisplayName={profile?.displayName || user.name || user.email?.split('@')[0] || 'Scholar'}
          userEmail={user.email || ''}
          userAvatarUrl={profile?.avatarUrl || null}
          initialLanguage={profile?.preferredLanguage || 'en'}
        />

        {/* Main Content Workspace Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <WorkspaceThreePanelView
          notebook={notebook}
          sources={sources}
          notes={notes}
          onOpenAddSource={() => setAddSourceOpen(true)}
          onOpenSourceViewer={(source) => {
            setSourceViewerSource(source);
            setSourceViewerHighlightChunkId(null);
          }}
          onToggleSourceEnabled={handleToggleSourceEnabled}
          onRenameSource={handleRenameSource}
          onDeleteSource={handleDeleteSource}
          onRetrySource={handleRetrySource}
          hasApiKey={userKeys.length > 0}
          onOpenSettings={() => setSettingsOpen(true)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userKeys={userKeys}
          onOpenManageKeys={() => setManageKeysOpen(true)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onResendMessage={handleResendMessage}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          streamingCitations={streamingCitations}
          onStopStreaming={handleStopStreaming}
          onSaveNoteFromMessage={handleSaveNoteFromMessage}
          onCitationClick={handleCitationClick}
          selectedModelId={selectedModelId}
          onSelectModelId={setSelectedModelId}
          selectedMode={selectedMode}
          onSelectMode={setSelectedMode}
          outputs={outputs}
          onRefreshOutputs={refreshOutputs}
        />
      </div>
    </div>

      {/* Dialogs */}
      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={setAddSourceOpen}
        notebookId={notebook.id}
        onSourceAdded={() => {
          fetchLatestSources();
          router.refresh();
        }}
      />

      <SourceViewerDialog
        source={sourceViewerSource}
        open={Boolean(sourceViewerSource)}
        onOpenChange={(open) => {
          if (!open) {
            setSourceViewerSource(null);
            setSourceViewerHighlightChunkId(null);
          }
        }}
        highlightChunkId={sourceViewerHighlightChunkId}
      />

      <GeminiSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
        initialDisplayName={profile?.displayName || user.name || user.email?.split('@')[0] || 'Learner'}
        initialInstructions={profile?.customInstructions || ''}
        initialLanguage={profile?.preferredLanguage || 'English'}
      />

      <ManageApiKeysDialog
        open={manageKeysOpen}
        onOpenChange={setManageKeysOpen}
        onKeysUpdated={() => {
          refreshUserKeys();
          router.refresh();
        }}
      />
    </div>
  );
}
