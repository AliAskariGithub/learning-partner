'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button, Input } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ExternalLink,
  Check,
  AlertCircle,
  AlertTriangle,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Bot,
  Key,
  Server,
  Zap,
  HelpCircle,
  ShieldAlert,
  Layers,
  ArrowRight,
  RefreshCw,
  Trash2,
  Sliders,
  Database,
} from 'lucide-react';
import { PROVIDER_LINKS } from '@/config/provider-links';
import {
  getUserConnections,
  addApiKeyConnection,
  getOAuthAuthorizationUrl,
  disconnectConnection,
  testConnection,
  testUnsavedCredentials,
  toggleAutoFallback,
} from '@/app/app/connection-actions';
import { SafeConnection, ProviderId, CallMode } from '@/lib/connections/types';
import { saveBrowserKey, diagnoseLocalEndpoint, LocalDiagnosticResult } from '@/lib/connections/browser-store';
import { useToast } from '@/components/ui/toast';

interface ConnectAiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOnboarding?: boolean;
  onConnected?: () => void;
  onKeysUpdated?: () => void;
  onModelSelected?: (modelId: string) => void;
}

export function ConnectAiDialog({
  open,
  onOpenChange,
  isOnboarding = false,
  onConnected,
  onKeysUpdated,
  onModelSelected,
}: ConnectAiDialogProps) {
  const { toast } = useToast();

  const [connections, setConnections] = useState<SafeConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [secondaryExpanded, setSecondaryExpanded] = useState(false);

  // Gemini Setup Form State
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiShowKey, setGeminiShowKey] = useState(false);
  const [geminiValidating, setGeminiValidating] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiFeedback, setGeminiFeedback] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Secondary Provider Active Form State
  const [activeSecondaryProvider, setActiveSecondaryProvider] = useState<ProviderId | null>(null);
  const [secondaryKeyInput, setSecondaryKeyInput] = useState('');
  const [secondaryUrlInput, setSecondaryUrlInput] = useState('');
  const [secondaryModelInput, setSecondaryModelInput] = useState('');
  const [secondaryCallMode, setSecondaryCallMode] = useState<CallMode>('server');
  const [secondaryValidating, setSecondaryValidating] = useState(false);
  const [testingCredentials, setTestingCredentials] = useState(false);
  const [secondaryFeedback, setSecondaryFeedback] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Browser Mode Diagnostic State
  const [diagnosticTesting, setDiagnosticTesting] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<LocalDiagnosticResult | null>(null);

  // Feature Flag: ChatGPT Plan Usage
  const isChatGPTPlanEnabled =
    typeof process !== 'undefined' &&
    process.env.NEXT_PUBLIC_OPENAI_PLAN_USAGE_ENABLED === 'true';

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await getUserConnections();
      setConnections(data);
    } catch (e) {
      console.error('Failed to load connections:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadConnections();
      setGeminiFeedback(null);
      setSecondaryFeedback(null);
      setDiagnosticResult(null);
    }
  }, [open]);

  // Handle Save Gemini Key (Primary Option 1)
  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) {
      setGeminiFeedback({ success: false, message: 'Please enter a valid Gemini API key.' });
      return;
    }

    setGeminiValidating(true);
    setGeminiFeedback(null);

    try {
      const res = await addApiKeyConnection({
        provider: 'gemini',
        key: geminiKeyInput.trim(),
        label: `Gemini Key (...${geminiKeyInput.trim().slice(-4)})`,
      });

      if (!res.success) {
        setGeminiFeedback({
          success: false,
          message: res.error || 'Validation failed. Check your API key and quota.',
        });
        toast({ title: 'Connection Failed', description: res.error, variant: 'error' });
      } else {
        setGeminiFeedback({
          success: true,
          message: 'Gemini Key successfully validated & saved! Chat, studio, and voice are ready.',
        });
        toast({
          title: 'Connected to Gemini',
          description: 'Your Gemini API key is active.',
          variant: 'success',
        });
        setGeminiKeyInput('');
        loadConnections();
        if (onConnected) onConnected();
        if (onKeysUpdated) onKeysUpdated();
        if (onModelSelected) onModelSelected('gemini-3.8-flash');

        // Automatically close the popup after completing an action
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      }
    } catch (err: any) {
      setGeminiFeedback({ success: false, message: err.message || 'An unexpected error occurred.' });
    } finally {
      setGeminiValidating(false);
    }
  };

  // Immediate Test for Gemini Key
  const handleTestGeminiKey = async () => {
    if (!geminiKeyInput.trim()) {
      setGeminiFeedback({ success: false, message: 'Please enter a Gemini API key first to test.' });
      return;
    }
    setGeminiTesting(true);
    setGeminiFeedback(null);
    try {
      const res = await testUnsavedCredentials({
        provider: 'gemini',
        key: geminiKeyInput.trim(),
      });
      if (res.healthy) {
        setGeminiFeedback({
          success: true,
          message: '✓ Connection Test Successful: Google Gemini API key is valid and working!',
        });
      } else {
        setGeminiFeedback({
          success: false,
          message: `✗ Test Failed: ${res.error || 'Invalid Gemini API key.'}`,
        });
      }
    } catch (err: any) {
      setGeminiFeedback({ success: false, message: `✗ Error testing connection: ${err.message}` });
    } finally {
      setGeminiTesting(false);
    }
  };

  // Immediate Test for Secondary Provider
  const handleTestSecondary = async (provider: ProviderId) => {
    setTestingCredentials(true);
    setSecondaryFeedback(null);
    try {
      if (secondaryCallMode === 'browser' && provider === 'custom') {
        const url = (secondaryUrlInput.trim() || 'http://localhost:20128/v1').replace(/\/+$/, '');
        const res = await fetch(`${url}/models`, {
          headers: secondaryKeyInput.trim() ? { Authorization: `Bearer ${secondaryKeyInput.trim()}` } : {},
          signal: AbortSignal.timeout(6000),
        }).catch((err) => ({ ok: false, statusText: err.message }));

        if (res.ok) {
          setSecondaryFeedback({
            success: true,
            message: '✓ Connection Test Successful: Local browser endpoint is reachable and responding!',
          });
        } else {
          setSecondaryFeedback({
            success: false,
            message: `✗ Test Failed: Could not reach endpoint (${(res as any).statusText || 'Connection refused'}). Ensure your local server is running with CORS enabled.`,
          });
        }
      } else {
        const res = await testUnsavedCredentials({
          provider,
          key: secondaryKeyInput.trim(),
          baseUrl: secondaryUrlInput.trim() || undefined,
          callMode: 'server',
          modelName: secondaryModelInput.trim() || undefined,
        });

        if (res.healthy) {
          setSecondaryFeedback({
            success: true,
            message: `✓ Connection Test Successful: ${provider.toUpperCase()} credentials and endpoint are verified!`,
          });
        } else {
          setSecondaryFeedback({
            success: false,
            message: `✗ Test Failed: ${res.error || 'Verification failed. Please check your credentials.'}`,
          });
        }
      }
    } catch (err: any) {
      setSecondaryFeedback({
        success: false,
        message: `✗ Test Error: ${err.message || 'Network error'}`,
      });
    } finally {
      setTestingCredentials(false);
    }
  };

  // Handle Save Secondary Key
  const handleSaveSecondary = async (provider: ProviderId) => {
    setSecondaryValidating(true);
    setSecondaryFeedback(null);

    try {
      // If browser mode, save key directly to client-side IndexedDB
      if (secondaryCallMode === 'browser' && provider === 'custom') {
        const res = await addApiKeyConnection({
          provider,
          baseUrl: secondaryUrlInput.trim() || 'http://localhost:20128/v1',
          callMode: 'browser',
          modelName: secondaryModelInput.trim() || undefined,
          label: `Custom (${secondaryModelInput.trim() || 'Browser Mode'})`,
        });

        if (res.success && res.connection) {
          if (secondaryKeyInput.trim()) {
            await saveBrowserKey(res.connection.id, secondaryKeyInput.trim());
          }
          setSecondaryFeedback({
            success: true,
            message: 'Connected in Browser Mode! Key stored exclusively in your browser IndexedDB.',
          });
          toast({ title: 'Connected', description: 'Browser mode endpoint ready.', variant: 'success' });
          loadConnections();
          if (onConnected) onConnected();
          if (onKeysUpdated) onKeysUpdated();
          if (onModelSelected) {
            onModelSelected(secondaryModelInput.trim() || 'custom-model');
          }
          setTimeout(() => {
            onOpenChange(false);
          }, 500);
        } else {
          setSecondaryFeedback({ success: false, message: res.error || 'Failed to register connection.' });
        }
      } else {
        // Server mode
        const res = await addApiKeyConnection({
          provider,
          key: secondaryKeyInput.trim(),
          baseUrl: secondaryUrlInput.trim() || undefined,
          modelName: secondaryModelInput.trim() || undefined,
          callMode: 'server',
        });

        if (res.success) {
          setSecondaryFeedback({ success: true, message: 'Successfully connected and verified!' });
          toast({ title: 'Connected', description: `${provider} connection active.`, variant: 'success' });
          const chosenModel =
            provider === 'openrouter'
              ? secondaryModelInput.trim() || 'meta-llama/llama-3.3-70b-instruct'
              : provider === 'custom'
              ? secondaryModelInput.trim() || 'custom-model'
              : provider === 'openai'
              ? 'gpt-4o'
              : 'claude-3-5-sonnet-20241022';

          setSecondaryKeyInput('');
          setSecondaryUrlInput('');
          setSecondaryModelInput('');
          loadConnections();
          if (onConnected) onConnected();
          if (onKeysUpdated) onKeysUpdated();
          if (onModelSelected) onModelSelected(chosenModel);

          setTimeout(() => {
            onOpenChange(false);
          }, 500);
        } else {
          setSecondaryFeedback({ success: false, message: res.error || 'Failed to validate connection.' });
        }
      }
    } catch (err: any) {
      setSecondaryFeedback({ success: false, message: err.message || 'Error saving connection.' });
    } finally {
      setSecondaryValidating(false);
    }
  };

  const handleConnectChatGPT = async () => {
    try {
      const res = await getOAuthAuthorizationUrl('chatgpt', window.location.pathname);
      if (res.url) {
        window.location.href = res.url;
      } else {
        toast({
          title: 'Connection Error',
          description: res.error || 'Failed to start ChatGPT connection.',
          variant: 'error',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to initiate ChatGPT OAuth.',
        variant: 'error',
      });
    }
  };

  const handleConnectOpenRouter = async () => {
    try {
      const res = await getOAuthAuthorizationUrl('openrouter', window.location.pathname);
      if (res.url) {
        window.location.href = res.url;
      } else {
        toast({
          title: 'Connection Error',
          description: res.error || 'Failed to start OpenRouter connection.',
          variant: 'error',
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message || 'Failed to initiate OpenRouter OAuth.',
        variant: 'error',
      });
    }
  };

  // Run Browser Mode Diagnostics for Localhost
  const handleRunDiagnostics = async () => {
    setDiagnosticTesting(true);
    setDiagnosticResult(null);
    try {
      const res = await diagnoseLocalEndpoint(
        secondaryUrlInput || 'http://localhost:20128/v1',
        secondaryKeyInput
      );
      setDiagnosticResult(res);
    } catch (e: any) {
      setDiagnosticResult({
        ok: false,
        stage: 'unreachable',
        title: 'Diagnostic Error',
        message: e.message || 'Failed to run probe',
        fix: 'Ensure your local gateway service is started.',
      });
    } finally {
      setDiagnosticTesting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isOnboarding ? 'Welcome to Learning Partner' : 'Connect Your AI'}
      description={
        isOnboarding
          ? 'To research, generate quizzes, and synthesize audio podcasts from your documents, connect your AI provider below.'
          : 'Choose a primary connection or add secondary providers. Credentials are encrypted at rest with AES-256-GCM.'
      }
      className="max-w-3xl max-h-[92dvh] sm:max-h-[88vh] overflow-hidden flex flex-col p-4 sm:p-6"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-5 sm:space-y-6 pr-1 sm:pr-2 py-1 pb-10 scrollbar-thin scrollbar-thumb-[#383838]">
        {/* Onboarding Welcome Banner */}
        {isOnboarding && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-[#f4f4f2] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-500/20 text-brand-300 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="font-serif leading-relaxed text-[#b8b8b0]">
                Choose how you want to power your study partner. We recommend <strong>Google Gemini Key</strong> for quick, full-featured access including 1M context and native Voice podcasts.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs shrink-0 text-[#9a9a94] hover:text-[#f4f4f2] self-end sm:self-auto"
            >
              Skip for now
            </Button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRIMARY OPTIONS GRID: TWO CARDS SIDE BY SIDE ON DESKTOP */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* PRIMARY OPTION 1: "USE GEMINI KEY" (Recommended) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#202020] border-2 border-purple-500/40 relative flex flex-col justify-between gap-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-display font-bold text-[#f4f4f2]">Use Gemini Key</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-display font-bold">
                  <Sparkles className="w-3 h-3" /> Recommended
                </span>
              </div>

              {/* 3-Step Guided Helper */}
              <div className="p-3 rounded-xl bg-[#202020] border border-[#2d2d2d] text-xs space-y-1.5 text-[#b8b8b0] font-serif">
                <p className="font-sans font-semibold text-[11px] text-[#f4f4f2] mb-1">
                  Guided 3-Step Setup:
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span>1. Open Google AI Studio</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-brand-300 hover:text-brand-200 transition-colors bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20 shrink-0"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p>2. Create and copy your key</p>
                <p>3. Paste it below to validate &amp; save</p>
              </div>

              {/* Key Input Field with Show/Hide */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    type={geminiShowKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    className="pr-10 text-xs font-mono bg-[#141414] border-[#333333] focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setGeminiShowKey(!geminiShowKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9a9a94] hover:text-[#f4f4f2] transition"
                  >
                    {geminiShowKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Validation Feedback */}
                {geminiFeedback && (
                  <div
                    className={`p-2 rounded-xl text-[11px] flex items-start gap-1.5 font-sans leading-tight ${
                      geminiFeedback.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {geminiFeedback.success ? (
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{geminiFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* MUSTARD-YELLOW PRIVACY NOTICE (Hard Requirement 2) */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200/90 text-[11px] font-serif leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-sans font-semibold text-amber-300 text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Important Privacy Notice (Free Tier)</span>
                </div>
                <p>
                  On Google’s free tier, Google may use submitted content to improve its products. Users should not upload private or confidential study documents with a free-tier key; use a paid-tier key or another provider for sensitive material.{' '}
                  <a
                    href="https://ai.google.dev/gemini-api/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-white"
                  >
                    Google Terms
                  </a>
                </p>
              </div>

              {/* Rate Limits Note */}
              <p className="text-[10px] text-[#9a9a94] font-mono">
                Free-tier: Up to 15 RPM / 1M TPM on Flash models. Graceful 429 backoff included.
              </p>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={geminiTesting || !geminiKeyInput.trim()}
                onClick={handleTestGeminiKey}
                className="w-full text-xs font-display font-semibold inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#3a3a3a] hover:border-brand-500 text-[#f4f4f2]"
              >
                {geminiTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-brand-400" />
                    <span>Test Connection</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={geminiValidating || !geminiKeyInput.trim()}
                onClick={handleSaveGeminiKey}
                className="w-full text-xs font-display font-semibold inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl shrink-0"
              >
                {geminiValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Validate & Save</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* PRIMARY OPTION 2: "CONNECT WITH CHATGPT" (Plan Usage) */}
          <div className="p-5 rounded-2xl bg-[#202020] border border-[#333333] relative flex flex-col justify-between gap-4 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-display font-bold text-[#f4f4f2]">Connect with ChatGPT</span>
                </div>
                {!isChatGPTPlanEnabled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#282828] border border-[#3a3a3a] text-[#9a9a94] text-[11px] font-mono">
                    Coming soon
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono">
                    Requires Plus / Pro
                  </span>
                )}
              </div>

              <p className="text-xs text-[#b8b8b0] font-serif leading-relaxed">
                Fund advanced OpenAI reasoning models directly from your existing personal ChatGPT Plus or Pro subscription without managing raw API billing.
              </p>

              {/* Plan Usage Notice & Controls */}
              <div className="p-3 rounded-xl bg-[#202020] border border-[#2d2d2d] text-xs text-[#9a9a94] font-serif space-y-2 leading-relaxed">
                <p>
                  • <strong>Requires ChatGPT Plus or Pro:</strong> Free accounts cannot grant plan token scopes.
                </p>
                <p>
                  • <strong>User Control:</strong> Usage counts toward your subscription allowance. You manage weekly caps and revoke access anytime in your ChatGPT Settings.
                </p>
                <p>
                  • <strong>Plan Boundaries:</strong> Streaming is required; persistent vector storage is disabled for plan-funded requests.
                </p>
              </div>

              {/* Fallback Info */}
              <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-[11px] text-[#9a9a94] font-serif flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 shrink-0 text-brand-400" />
                <span>Opt-in automatic fallback to Gemini Key when ChatGPT quota is exhausted.</span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              disabled={!isChatGPTPlanEnabled}
              onClick={handleConnectChatGPT}
              className={`w-full text-xs font-display font-semibold inline-flex items-center justify-center gap-2 py-2.5 rounded-xl shrink-0 mt-3 ${
                !isChatGPTPlanEnabled
                  ? 'opacity-60 cursor-not-allowed bg-[#252525] border border-[#353535] text-[#888882]'
                  : 'hover:border-cyan-500/50'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>{isChatGPTPlanEnabled ? 'Sign in with ChatGPT' : 'ChatGPT Plan Usage (Coming Soon)'}</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECONDARY OPTIONS: "Want to use another platform?" (Framer Motion Collapsible) */}
        {/* ========================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setSecondaryExpanded(!secondaryExpanded)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#191919] hover:bg-[#202020] border border-[#2d2d2d] hover:border-[#383838] text-xs font-display font-semibold text-[#f4f4f2] transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Want to use another platform?</span>
              <span className="text-[11px] text-[#9a9a94] font-serif font-normal">
                (Claude, OpenAI, OpenRouter, Custom Configuration)
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#9a9a94] transition-transform duration-200 ${
                secondaryExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {secondaryExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="overflow-hidden mt-3 space-y-3"
              >
                {/* Secondary Providers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Claude */}
                  <div className="p-4 rounded-xl bg-[#191919] border border-[#2e2e2e] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-[#f4f4f2]">Anthropic Claude</span>
                        <a
                          href="https://console.anthropic.com/settings/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-400 hover:underline flex items-center gap-0.5"
                        >
                          Keys Console <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                        Use an Anthropic API key. Claude subscriptions (Free, Pro, Max) can&apos;t be used in other apps.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveSecondaryProvider('anthropic')}
                      className="text-xs border border-[#333333] hover:border-brand-500 w-full mt-2"
                    >
                      Connect Claude Key
                    </Button>
                  </div>

                  {/* OpenAI API Key */}
                  <div className="p-4 rounded-xl bg-[#191919] border border-[#2e2e2e] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-[#f4f4f2]">OpenAI API Key</span>
                        <a
                          href="https://platform.openai.com/api-keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-400 hover:underline flex items-center gap-0.5"
                        >
                          Platform Keys <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                        Developer API key for GPT-4o, reasoning models (o3-mini), and embeddings.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveSecondaryProvider('openai')}
                      className="text-xs border border-[#333333] hover:border-brand-500 w-full mt-2"
                    >
                      Connect OpenAI Key
                    </Button>
                  </div>

                  {/* OpenRouter */}
                  <div className="p-4 rounded-xl bg-[#191919] border border-[#2e2e2e] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-[#f4f4f2]">OpenRouter</span>
                        <a
                          href="https://openrouter.ai/keys"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-400 hover:underline flex items-center gap-0.5"
                        >
                          Keys <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                      <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                        Unified router for open weights and commercial models. Supports 1-click OAuth PKCE.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleConnectOpenRouter}
                        className="text-[11px] border border-brand-500/30 text-brand-300 hover:bg-brand-500/10"
                      >
                        1-Click OAuth
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveSecondaryProvider('openrouter')}
                        className="text-[11px] border border-[#333333] hover:border-brand-500"
                      >
                        Add Key
                      </Button>
                    </div>
                  </div>

                  {/* Custom Configuration */}
                  <div className="p-4 rounded-xl bg-[#191919] border border-[#2e2e2e] space-y-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-[#f4f4f2]">Custom Configuration</span>
                        <span className="text-[10px] font-mono text-[#9a9a94]">OpenAI-compatible</span>
                      </div>
                      <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                        Connect any OpenAI-compatible API or self-hosted model (Ollama, LM Studio, vLLM, AgentRouter).
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveSecondaryProvider('custom');
                        setSecondaryUrlInput('');
                        setSecondaryCallMode('server');
                      }}
                      className="text-xs border border-[#333333] hover:border-brand-500 w-full mt-2"
                    >
                      Configure Endpoint
                    </Button>
                  </div>
                </div>

                {/* Sub-Form for Selected Secondary Provider */}
                {activeSecondaryProvider && (
                  <div className="p-4 rounded-2xl bg-[#141414] border border-brand-500/30 space-y-3 mt-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-display font-bold text-[#f4f4f2]">
                        Connect {PROVIDER_LINKS[activeSecondaryProvider]?.name || activeSecondaryProvider}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveSecondaryProvider(null)}
                        className="text-xs text-[#9a9a94] hover:text-[#f4f4f2]"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Mode Switch for OmniRoute / Custom */}
                    {(activeSecondaryProvider === 'omniroute' || activeSecondaryProvider === 'custom') && (
                      <div className="space-y-2 p-3 rounded-xl bg-[#1c1c1c] border border-[#2b2b2b]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-display font-semibold text-[#f4f4f2]">Call Mode</span>
                          <div className="flex rounded-lg bg-[#141414] p-0.5 border border-[#333333]">
                            <button
                              type="button"
                              onClick={() => setSecondaryCallMode('server')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-display font-medium transition cursor-pointer ${
                                secondaryCallMode === 'server'
                                  ? 'bg-[#2a2a2a] text-[#f4f4f2]'
                                  : 'text-[#9a9a94] hover:text-[#f4f4f2]'
                              }`}
                            >
                              Server Mode
                            </button>
                            <button
                              type="button"
                              onClick={() => setSecondaryCallMode('browser')}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-display font-medium transition cursor-pointer ${
                                secondaryCallMode === 'browser'
                                  ? 'bg-[#2a2a2a] text-[#f4f4f2]'
                                  : 'text-[#9a9a94] hover:text-[#f4f4f2]'
                              }`}
                            >
                              Browser Mode (Localhost)
                            </button>
                          </div>
                        </div>

                        {secondaryCallMode === 'browser' ? (
                          <div className="text-[11px] text-[#b8b8b0] font-serif space-y-1 pt-1 border-t border-[#262626]">
                            <div className="flex items-center gap-1.5 text-cyan-300 font-sans font-semibold">
                              <Database className="w-3.5 h-3.5" />
                              <span>Direct Browser Calling (Key Stored in IndexedDB)</span>
                            </div>
                            <p>
                              Your browser calls your local endpoint directly. Keys are kept exclusively in local IndexedDB and never sent to our servers.
                            </p>
                            <p className="text-[#9a9a94]">
                              Ensure CORS headers (<code className="text-brand-300 font-mono">Access-Control-Allow-Origin: *</code>) are permitted on your gateway.
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#9a9a94] font-serif pt-1 border-t border-[#262626]">
                            In Server Mode, our server makes inference calls to your public HTTPS endpoint. Protected against SSRF.
                          </p>
                        )}
                      </div>
                    )}

                    {/* URL Input if custom/omniroute */}
                    {(activeSecondaryProvider === 'omniroute' || activeSecondaryProvider === 'custom') && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#9a9a94]">
                          {secondaryCallMode === 'browser' ? 'Local Base URL' : 'Public HTTPS Base URL'}
                        </label>
                        <Input
                          type="text"
                          placeholder={
                            secondaryCallMode === 'browser'
                              ? 'http://localhost:20128/v1'
                              : 'https://gateway.example.com/v1'
                          }
                          value={secondaryUrlInput}
                          onChange={(e) => setSecondaryUrlInput(e.target.value)}
                          className="text-xs font-mono bg-[#191919] border-[#303030]"
                        />
                      </div>
                    )}

                    {/* Key Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-[#9a9a94]">
                        {activeSecondaryProvider === 'omniroute' || activeSecondaryProvider === 'custom'
                          ? 'API Key (Optional if gateway doesn\'t require auth)'
                          : 'API Key'}
                      </label>
                      <Input
                        type="password"
                        placeholder="Paste key here..."
                        value={secondaryKeyInput}
                        onChange={(e) => setSecondaryKeyInput(e.target.value)}
                        className="text-xs font-mono bg-[#191919] border-[#303030]"
                      />
                    </div>

                    {/* Model Name Input for Multi-Model Providers (OpenRouter & Custom) */}
                    {(activeSecondaryProvider === 'openrouter' || activeSecondaryProvider === 'custom') && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-mono text-[#9a9a94]">
                            Model Name / ID{' '}
                            {activeSecondaryProvider === 'custom'
                              ? '(e.g. llama3.2, mistral-large, gpt-4o-mini)'
                              : '(e.g. deepseek/deepseek-r1, meta-llama/llama-3.3-70b-instruct)'}
                          </label>
                          <span className="text-[10px] text-brand-400 font-mono">Multi-model</span>
                        </div>
                        <Input
                          type="text"
                          placeholder={
                            activeSecondaryProvider === 'openrouter'
                              ? 'deepseek/deepseek-r1 or meta-llama/llama-3.3-70b-instruct'
                              : 'llama3.2 or gpt-4o-mini'
                          }
                          value={secondaryModelInput}
                          onChange={(e) => setSecondaryModelInput(e.target.value)}
                          className="text-xs font-mono bg-[#191919] border-[#303030]"
                        />
                        <p className="text-[10px] text-[#888882] font-serif">
                          Enter your desired model identifier. It will be added to the Model Switcher and pinned to the top when connected.
                        </p>
                      </div>
                    )}

                    {/* Diagnostic Tool for Localhost in Browser Mode */}
                    {secondaryCallMode === 'browser' &&
                      (activeSecondaryProvider === 'omniroute' || activeSecondaryProvider === 'custom') && (
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={diagnosticTesting}
                            onClick={handleRunDiagnostics}
                            className="text-xs border border-[#333333] hover:border-cyan-500 w-full"
                          >
                            {diagnosticTesting ? 'Probing Localhost Endpoint...' : 'Run Diagnostics & Test Local Connection'}
                          </Button>

                          {diagnosticResult && (
                            <div
                              className={`p-3 rounded-xl text-xs space-y-1 ${
                                diagnosticResult.ok
                                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                  : 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                              }`}
                            >
                              <p className="font-semibold">{diagnosticResult.title}</p>
                              <p className="font-serif text-[11px] text-[#b8b8b0]">{diagnosticResult.message}</p>
                              {diagnosticResult.fix && (
                                <p className="font-sans text-[11px] text-amber-300 pt-1">
                                  <strong>Recommended fix:</strong> {diagnosticResult.fix}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                    {secondaryFeedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs flex items-start gap-1.5 leading-snug ${
                          secondaryFeedback.success
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                        }`}
                      >
                        {secondaryFeedback.success ? (
                          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        )}
                        <span>{secondaryFeedback.message}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={
                          testingCredentials ||
                          (!secondaryKeyInput.trim() && secondaryCallMode !== 'browser')
                        }
                        onClick={() => handleTestSecondary(activeSecondaryProvider)}
                        className="w-full text-xs font-display font-semibold inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-[#3a3a3a] hover:border-brand-500 text-[#f4f4f2]"
                      >
                        {testingCredentials ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Testing...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-brand-400" />
                            <span>Test Connection</span>
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="primary"
                        disabled={secondaryValidating}
                        onClick={() => handleSaveSecondary(activeSecondaryProvider)}
                        className="w-full text-xs font-display font-semibold inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl"
                      >
                        {secondaryValidating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Connection</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active Connections List (If Any Configured) */}
        {connections.length > 0 && (
          <div className="pt-4 border-t border-[#262626] space-y-2">
            <h4 className="text-xs font-display font-bold text-[#9a9a94] uppercase tracking-wider">
              Connected Providers ({connections.length})
            </h4>
            <div className="space-y-1.5">
              {connections.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-[#191919] border border-[#2d2d2d] flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-display font-semibold text-[#f4f4f2] truncate">{c.accountLabel}</p>
                        {c.configuredModel && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/15 text-brand-300 border border-brand-500/30 truncate">
                            {c.configuredModel}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#9a9a94] font-mono truncate">
                        {c.provider.toUpperCase()} · {c.method} · {c.callMode} mode
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end xs:self-auto shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        c.status === 'connected'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : c.status === 'capped_or_exhausted'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      {c.status}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await disconnectConnection(c.id);
                        loadConnections();
                      }}
                      className="p-1 text-[#9a9a94] hover:text-rose-400 transition"
                      title="Disconnect"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}

// Keep ManageApiKeysDialog export for backwards compatibility
export const ManageApiKeysDialog = ConnectAiDialog;
