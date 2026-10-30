'use client';

import React, { useState, useEffect, useCallback, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Notebook, Source, Note, Profile, Conversation, Message, Citation, StudioOutput } from '@/db/schema';
import { NotebookSidebar } from '@/components/workspace/NotebookSidebar';
import { WorkspaceThreePanelView } from '@/components/workspace/WorkspaceThreePanelView';
import { AddSourceDialog } from '@/components/workspace/AddSourceDialog';
import { SourceViewerDialog } from '@/components/workspace/SourceViewerDialog';
import { ConnectAiDialog } from '@/components/ai/ConnectAiDialog';
import { useToast } from '@/components/ui/toast';
import { SafeApiKey, getUserApiKeys } from '@/app/app/api-key-actions';
import { getNotebookOutputs } from '@/app/app/studio-actions';
import {
  getConversations,
  getConversationMessages,
  createConversation,
  deleteConversation,
  updateConversationTitle,
  saveNoteFromMessage,
  deleteMessage,
  updateMessage,
  saveBrowserChatMessage,
} from '@/app/app/chat-actions';
import { getBrowserKey } from '@/lib/connections/browser-store';
import {
  toggleSourceEnabled,
  renameSource,
  deleteSource,
  retrySource,
  getNotebookNotes,
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
  initialActiveConversationId?: string | null;
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
  initialActiveConversationId,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open sidebar by default on desktop, keep closed on mobile & tablet
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, []);

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
    initialActiveConversationId !== undefined
      ? initialActiveConversationId
      : (initialConversations[0]?.id || null)
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Dialog States
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [sourceViewerSource, setSourceViewerSource] = useState<Source | null>(null);
  const [sourceViewerHighlightChunkId, setSourceViewerHighlightChunkId] = useState<string | null>(null);
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

  // Listen for OAuth feedback in URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const connected = params.get('connected');
      const connError = params.get('connection_error');
      if (connected) {
        toast({
          title: 'Connection Established',
          description: `Successfully connected ${connected}.`,
          variant: 'success',
        });
        refreshUserKeys();
        window.history.replaceState({}, '', window.location.pathname);
      } else if (connError) {
        toast({
          title: 'Connection Failed',
          description: decodeURIComponent(connError),
          variant: 'error',
        });
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [refreshUserKeys, toast]);

  // Onboarding trigger: Show ConnectAiDialog if user has 0 connections on first visit
  useEffect(() => {
    try {
      const shown = localStorage.getItem('lp_connect_ai_onboarding_shown');
      if (!shown && (!initialUserKeys || initialUserKeys.length === 0)) {
        setManageKeysOpen(true);
        localStorage.setItem('lp_connect_ai_onboarding_shown', 'true');
      }
    } catch {}
  }, [initialUserKeys]);

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
        variant: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Retry failed', description: err.message, variant: 'error' });
      fetchLatestSources();
    }
  };

  // Chat Handlers
  const handleSelectConversation = useCallback(async (convId: string) => {
    setActiveConversationId(convId);

    // Sync URL search param ?chat=<convId> without full reload
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.get('chat') !== convId) {
          url.searchParams.set('chat', convId);
          window.history.pushState({ chatId: convId }, '', url.toString());
        }
      }
    } catch (e) {
      console.warn('Failed to update URL search params:', e);
    }

    const conv = conversations.find((c) => c.id === convId);
    if (conv) {
      setSelectedModelId(conv.model);
      setSelectedMode(conv.mode as 'chat' | 'learn' | 'quiz');
    }

    setIsLoadingMessages(true);
    try {
      const msgs = await getConversationMessages(convId, user.id);
      setMessages(msgs);
    } catch (err: any) {
      console.error('Failed to load conversation messages:', err);
      toast({ title: 'Error loading conversation', description: err.message, variant: 'error' });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversations, toast, user.id]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent('');
    setStreamingCitations([]);
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('chat')) {
          url.searchParams.delete('chat');
          window.history.pushState({}, '', url.toString());
        }
      }
    } catch (e) {}
  }, []);

  // Ensures an active conversation exists before creating chat-scoped entities like Studio outputs
  const handleEnsureConversation = useCallback(
    async (title?: string): Promise<string> => {
      if (activeConversationId) return activeConversationId;
      const newConv = await createConversation({
        notebookId: notebook.id,
        model: selectedModelId,
        mode: selectedMode,
        title: title || 'New Chat',
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      try {
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('chat', newConv.id);
          window.history.pushState({ chatId: newConv.id }, '', url.toString());
        }
      } catch (e) {}
      return newConv.id;
    },
    [activeConversationId, notebook.id, selectedModelId, selectedMode]
  );

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      try {
        const url = new URL(window.location.href);
        const chatId = url.searchParams.get('chat');
        if (chatId) {
          if (chatId !== activeConversationId) {
            handleSelectConversation(chatId);
          }
        } else if (activeConversationId) {
          handleNewConversation();
        }
      } catch (e) {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeConversationId, handleSelectConversation, handleNewConversation]);

  const handleDeleteConversation = async (convId: string) => {
    try {
      await deleteConversation(convId, notebook.id);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeConversationId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          handleNewConversation();
        }
      }
      toast({ title: 'Conversation deleted', variant: 'neutral' });
    } catch (err: any) {
      toast({ title: 'Error deleting conversation', description: err.message, variant: 'error' });
    }
  };

  const handleRenameConversation = async (convId: string, title: string) => {
    try {
      await updateConversationTitle(convId, title);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title } : c))
      );
      toast({ title: 'Chat renamed', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to rename chat', description: err.message, variant: 'error' });
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

      // ---------------------------------------------------------
      // BROWSER MODE: Direct execution from browser to local gateway (e.g. localhost OmniRoute / Ollama)
      // ---------------------------------------------------------
      const isBrowserMode = res.headers.get('x-browser-mode') === 'true';
      if (isBrowserMode) {
        const payload = await res.json();
        const convId = payload.conversationId || activeConversationId;
        if (convId && convId !== activeConversationId) {
          setActiveConversationId(convId);
          try {
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.set('chat', convId);
              window.history.replaceState({ chatId: convId }, '', url.toString());
            }
          } catch (e) {}
          getConversations(notebook.id).then(setConversations).catch(() => {});
        }

        if (payload.citations) {
          setStreamingCitations(payload.citations);
        }

        // Retrieve local key from client-side IndexedDB if configured
        const localKey = payload.connectionId ? await getBrowserKey(payload.connectionId) : null;
        const targetEndpoint = (payload.endpoint || 'http://localhost:20128/v1').replace(/\/+$/, '');
        const completionsUrl = `${targetEndpoint}/chat/completions`;

        let localRes: Response;
        try {
          localRes = await fetch(completionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localKey ? { Authorization: `Bearer ${localKey}` } : {}),
            },
            body: JSON.stringify({
              model: payload.modelId,
              messages: [
                { role: 'system', content: payload.systemPrompt },
                ...payload.chatHistory,
              ],
              stream: true,
            }),
            signal: controller.signal,
          });
        } catch (fetchErr: any) {
          throw new Error(
            `Could not reach your local gateway at ${targetEndpoint}. Please verify that OmniRoute or your local service is running and CORS is enabled: ${fetchErr.message}`
          );
        }

        if (!localRes.ok) {
          const errData = await localRes.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || errData.message || `Local gateway returned status ${localRes.status}: ${localRes.statusText}`
          );
        }

        const reader = localRes.body?.getReader();
        if (!reader) throw new Error('No readable stream from local gateway.');

        const decoder = new TextDecoder();
        let accumulatedText = '';
        let sseBuffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') break;

            if (trimmed.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(trimmed.slice(6));
                const delta =
                  parsed.choices?.[0]?.delta?.content ||
                  parsed.choices?.[0]?.text ||
                  '';
                if (delta) {
                  accumulatedText += delta;
                  setStreamingContent(accumulatedText);
                }
              } catch {
                // Ignore partial JSON chunks
              }
            }
          }
        }

        // Fallback for non-streaming response
        if (!accumulatedText.trim() && sseBuffer.trim()) {
          try {
            const nonStreamJson = JSON.parse(sseBuffer.trim());
            accumulatedText =
              nonStreamJson.choices?.[0]?.message?.content ||
              nonStreamJson.choices?.[0]?.text ||
              '';
            if (accumulatedText) {
              setStreamingContent(accumulatedText);
            }
          } catch {}
        }

        if (!accumulatedText.trim()) {
          throw new Error('Local gateway completed without returning text. Please verify the model name and gateway logs.');
        }

        const finalConversationId = convId || 'pending';
        const assistantMsg: Message = {
          id: 'assistant-' + Date.now(),
          conversationId: finalConversationId,
          role: 'assistant',
          content: accumulatedText,
          citations: payload.citations || [],
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setStreamingContent('');

        // Persist to Neon Postgres DB via server action
        await saveBrowserChatMessage({
          conversationId: finalConversationId,
          notebookId: notebook.id,
          content: accumulatedText,
          citations: payload.citations || [],
          userPrompt: prompt.trim(),
        }).catch((err) => console.warn('Failed to save browser message:', err));

        getConversations(notebook.id).then(setConversations).catch(() => {});
        getNotebookNotes(notebook.id).then(setNotes).catch(() => {});
        return;
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
        try {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('chat', convIdHeader);
            window.history.replaceState({ chatId: convIdHeader }, '', url.toString());
          }
        } catch (e) {}
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
      getNotebookNotes(notebook.id).then(setNotes).catch(() => {});
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
        variant: 'success',
      });
    }
  };

  const handleSaveNoteFromMessage = async (content: string, title?: string) => {
    try {
      const saved = await saveNoteFromMessage({
        notebookId: notebook.id,
        conversationId: activeConversationId || null,
        title: title || 'Saved Insight',
        content,
      });
      setNotes((prev) => [saved, ...prev]);
      toast({
        title: 'Saved to Chat Notes',
        description: 'Insight added to this chat memory.',
        variant: 'success',
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
        variant: 'success',
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
      toast({ title: 'Message updated', variant: 'success' });
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
    <div className="flex flex-col h-screen h-[100dvh] w-full min-h-[100dvh] overflow-hidden bg-[#191919] text-[#f4f4f2]">
      {/* Top Red Alert Notification when user is not verified */}
      <UnverifiedBanner email={user.email || ''} isVerified={Boolean(user.emailVerified)} />

      <div className="flex flex-1 w-full overflow-hidden min-h-0">
        {/* Notebooks Sidebar (pinned first, list, add, rename, delete, and chats) */}
        <NotebookSidebar
          notebooks={allNotebooks}
          activeNotebookId={notebook.id}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onOpenSettings={() => router.push('/settings')}
          userDisplayName={profile?.displayName || user.name || user.email?.split('@')[0] || 'Scholar'}
          userEmail={user.email || ''}
          userAvatarUrl={profile?.avatarUrl || null}
          initialLanguage={profile?.preferredLanguage || 'en'}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
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
          onOpenSettings={() => router.push('/settings')}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          userKeys={userKeys}
          onOpenManageKeys={() => setManageKeysOpen(true)}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          messages={messages}
          isLoadingMessages={isLoadingMessages}
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
          onEnsureConversation={handleEnsureConversation}
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

      <ConnectAiDialog
        open={manageKeysOpen}
        onOpenChange={setManageKeysOpen}
        onConnected={() => {
          refreshUserKeys();
          router.refresh();
        }}
        onKeysUpdated={() => {
          refreshUserKeys();
          router.refresh();
        }}
        onModelSelected={(modelId) => {
          setSelectedModelId(modelId);
        }}
      />
    </div>
  );
}
