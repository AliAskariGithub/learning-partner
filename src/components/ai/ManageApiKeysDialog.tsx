'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button, Input } from '@/components/ui';
import {
  Key,
  Plus,
  Trash2,
  Pencil,
  Check,
  AlertCircle,
  AlertTriangle,
  Activity,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Sparkles,
  Bot,
  Zap,
} from 'lucide-react';
import {
  PROVIDER_REGISTRY,
  ProviderId,
  ProviderMeta,
} from '@/lib/ai/providers';
import {
  SafeApiKey,
  getUserApiKeys,
  addApiKey,
  deleteApiKey,
  updateApiKeyLabel,
  testExistingKey,
  discoverAndTestModels,
  TestedModelInfo,
} from '@/app/app/api-key-actions';
import { useToast } from '@/components/ui/toast';

interface ManageApiKeysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeysUpdated?: () => void;
  onSelectModel?: (modelId: string) => void;
}

export function ManageApiKeysDialog({
  open,
  onOpenChange,
  onKeysUpdated,
  onSelectModel,
}: ManageApiKeysDialogProps) {
  const { toast } = useToast();

  const [keys, setKeys] = useState<SafeApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('google');
  const [keyInput, setKeyInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Validation feedback state
  const [testing, setTesting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Editing label state
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editLabelText, setEditLabelText] = useState('');

  // Retesting state
  const [retestingKeyId, setRetestingKeyId] = useState<string | null>(null);

  // Model discovery & testing state
  const [discoveredModels, setDiscoveredModels] = useState<TestedModelInfo[]>([]);
  const [discoveredProvider, setDiscoveredProvider] = useState<ProviderId | null>(null);
  const [discoveringKeyId, setDiscoveringKeyId] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const userKeys = await getUserApiKeys();
      setKeys(userKeys);
    } catch (err: any) {
      toast({
        title: 'Error loading API keys',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchKeys();
      setValidationResult(null);
      setKeyInput('');
      setLabelInput('');
      setCustomBaseUrl('');
    }
  }, [open]);

  const activeProviderMeta = PROVIDER_REGISTRY[selectedProvider];

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setTesting(true);
    setValidationResult(null);

    try {
      const res = await addApiKey({
        provider: selectedProvider,
        label: labelInput.trim() || `${activeProviderMeta.name} Key`,
        key: keyInput.trim(),
        customBaseUrl: selectedProvider === 'custom' ? customBaseUrl.trim() : undefined,
      });

      if (res.success && res.key) {
        setValidationResult({
          success: true,
          message: `Key successfully verified with ${activeProviderMeta.name}! Fetching and testing supported models...`,
        });
        const currentKey = keyInput.trim();
        const currentProvider = selectedProvider;
        const currentBaseUrl = customBaseUrl.trim();

        setKeyInput('');
        setLabelInput('');
        setCustomBaseUrl('');
        await fetchKeys();
        onKeysUpdated?.();

        // Immediately fetch and test models supported by this API key
        setIsDiscovering(true);
        try {
          const discRes = await discoverAndTestModels({
            provider: currentProvider,
            apiKey: currentKey,
            customBaseUrl: currentBaseUrl || undefined,
          });
          if (discRes.success && discRes.models.length > 0) {
            setDiscoveredModels(discRes.models);
            setDiscoveredProvider(currentProvider);
            setValidationResult({
              success: true,
              message: `Key verified! Discovered ${discRes.models.length} supported models (${discRes.models.filter(m => m.status === 'working').length} verified online & ready).`,
            });
          }
        } catch (discErr) {
          console.warn('Model discovery failed:', discErr);
        } finally {
          setIsDiscovering(false);
        }

        toast({
          title: 'API Key Saved',
          description: `${activeProviderMeta.name} key is active and models tested.`,
          variant: 'success',
        });
      } else {
        setValidationResult({
          success: false,
          message: res.error || 'Failed to validate API key with provider.',
        });
      }
    } catch (err: any) {
      setValidationResult({
        success: false,
        message: err.message || 'Network error occurred during key validation.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to remove this API key?')) return;
    try {
      await deleteApiKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      onKeysUpdated?.();
      toast({ title: 'API Key Removed', variant: 'neutral' });
    } catch (err: any) {
      toast({ title: 'Error deleting key', description: err.message, variant: 'error' });
    }
  };

  const handleSaveRename = async (keyId: string) => {
    if (!editLabelText.trim()) return;
    try {
      await updateApiKeyLabel(keyId, editLabelText.trim());
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, label: editLabelText.trim() } : k))
      );
      setEditingKeyId(null);
      onKeysUpdated?.();
      toast({ title: 'Key Renamed', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Error renaming key', description: err.message, variant: 'error' });
    }
  };

  const handleCheckModelsForKey = async (keyId: string, provider: ProviderId) => {
    setDiscoveringKeyId(keyId);
    try {
      toast({
        title: 'Checking Models',
        description: `Querying available models from ${PROVIDER_REGISTRY[provider]?.name || provider}...`,
        variant: 'info',
      });
      const res = await discoverAndTestModels({ provider, keyId });
      if (res.success && res.models.length > 0) {
        setDiscoveredModels(res.models);
        setDiscoveredProvider(provider);
        toast({
          title: 'Models Verified',
          description: `Found ${res.models.length} supported models (${res.models.filter(m => m.status === 'working').length} working).`,
          variant: 'success',
        });
      } else {
        toast({
          title: 'No Models Found',
          description: res.error || 'Could not fetch models for this key.',
          variant: 'error',
        });
      }
    } catch (err: any) {
      toast({ title: 'Discovery Failed', description: err.message, variant: 'error' });
    } finally {
      setDiscoveringKeyId(null);
    }
  };

  const handleRetestKey = async (keyId: string) => {
    setRetestingKeyId(keyId);
    try {
      const res = await testExistingKey(keyId);
      if (res.valid) {
        toast({ title: 'Key Valid', description: 'Provider confirmed key is active.', variant: 'success' });
      } else {
        toast({
          title: 'Key Invalid',
          description: res.error || 'Provider rejected key.',
          variant: 'error',
        });
      }
      await fetchKeys();
      onKeysUpdated?.();
    } catch (err: any) {
      toast({ title: 'Test Failed', description: err.message, variant: 'error' });
    } finally {
      setRetestingKeyId(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Bring-Your-Own API Keys"
      description="Keys are encrypted server-side with AES-256-GCM. We never expose your plain keys or proxy your requests."
      className="max-w-2xl bg-[#1f1f1f] border-[#303030] text-[#f4f4f2] shadow-2xl rounded-2xl"
    >
      <div className="space-y-6 pt-2">
        {/* Provider Selector Tabs */}
          <div>
            <label className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2 block">
              1. Select AI Provider
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(PROVIDER_REGISTRY) as ProviderId[]).map((pId) => {
                const meta = PROVIDER_REGISTRY[pId];
                const isSelected = selectedProvider === pId;
                const connectedCount = keys.filter((k) => k.provider === pId).length;

                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(pId);
                      setValidationResult(null);
                    }}
                    className={`relative p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-brand-300 shadow-sm shadow-brand-500/20'
                        : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:border-[#404040] hover:text-[#f4f4f2]'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold text-xs truncate">{meta.name}</div>
                      <div className="text-[9px] text-[#9a9a94] font-serif truncate mt-0.5">
                        {meta.badge}
                      </div>
                    </div>
                    {connectedCount > 0 && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[9px] text-emerald-400 font-mono">
                        <Check className="w-2.5 h-2.5" />
                        {connectedCount} connected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Key Form */}
          <form
            onSubmit={handleAddKey}
            className="p-4 rounded-xl bg-[#262626] border border-[#303030] space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-display font-bold text-[#f4f4f2]">
                  Add {activeProviderMeta.name} API Key
                </h4>
                <p className="text-[11px] text-[#9a9a94] font-serif mt-0.5">
                  {activeProviderMeta.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activeProviderMeta.usageUrl && (
                  <a
                    href={activeProviderMeta.usageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-medium bg-[#191919] hover:bg-[#2e2e2e] border border-[#303030] text-amber-400 hover:text-amber-300 transition cursor-pointer shadow-sm"
                    title="View rate limits, quotas, and current consumption"
                  >
                    <Activity className="w-3 h-3" />
                    <span>View Usage</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#9a9a94]" />
                  </a>
                )}
                {activeProviderMeta.keyUrl && (
                  <a
                    href={activeProviderMeta.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-display text-brand-400 hover:text-brand-300 hover:underline"
                  >
                    Get key <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Custom base URL field for generic OpenAI compatible */}
            {selectedProvider === 'custom' && (
              <div>
                <label className="text-[11px] font-display font-medium text-[#9a9a94] mb-1 block">
                  Custom Base URL
                </label>
                <Input
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                  placeholder="e.g. http://localhost:11434/v1 or https://api.together.xyz/v1"
                  className="bg-[#191919] border-[#3a3a3a] text-xs text-[#f4f4f2]"
                />
              </div>
            )}

            {/* API Key Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-display font-medium text-[#9a9a94]">
                  Secret Key
                </label>
                <span className="text-[10px] text-[#71717a] font-mono">
                  {activeProviderMeta.keyFormatHint}
                </span>
              </div>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={activeProviderMeta.keyPlaceholder}
                  required
                  className="bg-[#191919] border-[#3a3a3a] text-xs text-[#f4f4f2] pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9a9a94] hover:text-[#f4f4f2] transition"
                >
                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Optional Label */}
            <div>
              <label className="text-[11px] font-display font-medium text-[#9a9a94] mb-1 block">
                Key Label (Optional)
              </label>
              <Input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder={`e.g. Primary ${activeProviderMeta.name}`}
                className="bg-[#191919] border-[#3a3a3a] text-xs text-[#f4f4f2]"
              />
            </div>

            {/* Live Test Feedback Banner */}
            {validationResult && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                  validationResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-red-950/40 border-red-500/50 text-red-300'
                }`}
              >
                {validationResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-serif leading-relaxed">
                  {validationResult.message}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={testing || !keyInput.trim()}
                variant="primary"
                size="sm"
                className="text-xs"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Validating with {activeProviderMeta.name}...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Validate & Connect Key
                  </>
                )}
              </Button>
            </div>
          </form>


          {/* Discovered & Tested Models Section */}
          {(isDiscovering || discoveredModels.length > 0) && (
            <div className="p-4 rounded-xl bg-[#262626] border border-[#3a3a3a] space-y-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <h4 className="text-xs font-display font-bold text-[#f4f4f2]">
                      Supported Models for {discoveredProvider ? PROVIDER_REGISTRY[discoveredProvider]?.name : activeProviderMeta.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#9a9a94] font-serif mt-0.5">
                    Live ping test results from your API key. Green models are verified working right now.
                  </p>
                </div>
                {discoveredProvider && PROVIDER_REGISTRY[discoveredProvider]?.usageUrl && (
                  <a
                    href={PROVIDER_REGISTRY[discoveredProvider].usageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-display font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition cursor-pointer"
                  >
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>View Usage</span>
                    <ExternalLink className="w-2.5 h-2.5 text-amber-300/60" />
                  </a>
                )}
              </div>

              {isDiscovering ? (
                <div className="py-6 text-center text-xs text-[#9a9a94] flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                  <span>Connecting to provider API and pinging candidate models...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {discoveredModels.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-[#191919] border border-[#303030] flex flex-col justify-between space-y-2 hover:border-[#404040] transition"
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0">
                          <h5 className="font-display font-bold text-xs text-[#f4f4f2] truncate">
                            {m.name}
                          </h5>
                          <p className="text-[10px] text-[#9a9a94] font-mono mt-0.5">
                            {Math.round(m.contextWindow / 1000)}k context
                          </p>
                        </div>
                        {m.status === 'working' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Working
                          </span>
                        ) : m.status === 'quota_exceeded' ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0"
                            title={m.statusDetails}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Quota Limit
                          </span>
                        ) : (
                          <span
                            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0"
                            title={m.statusDetails}
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            Unavailable
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#262626]">
                        <span className="text-[#71717a] font-serif truncate max-w-[150px]">
                          {m.statusDetails || 'Tested'}
                        </span>
                        {m.status === 'working' && onSelectModel && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectModel(m.id);
                              toast({
                                title: 'Model Activated',
                                description: `Switched to ${m.name}.`,
                                variant: 'success',
                              });
                            }}
                            className="text-brand-400 hover:text-brand-300 font-display font-semibold hover:underline cursor-pointer"
                          >
                            Use Model
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connected Keys List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                2. Connected API Keys ({keys.length})
              </label>
              <button
                type="button"
                onClick={fetchKeys}
                className="text-[11px] font-display text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {keys.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-[#303030] text-center bg-[#191919]/50">
                <Key className="w-6 h-6 text-[#9a9a94] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-display font-semibold text-[#f4f4f2]">
                  No API Keys Connected
                </p>
                <p className="text-[11px] text-[#9a9a94] font-serif mt-0.5 max-w-sm mx-auto">
                  Add an API key above to unlock AI chat, grounded citations, and study tools.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((k) => {
                  const meta = PROVIDER_REGISTRY[k.provider] || PROVIDER_REGISTRY.custom;
                  const isEditing = editingKeyId === k.id;
                  const isRetesting = retestingKeyId === k.id;

                  return (
                    <div
                      key={k.id}
                      className="p-3 rounded-xl bg-[#262626] border border-[#303030] flex items-center justify-between gap-3 text-xs hover:border-[#404040] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#191919] border border-[#303030] flex items-center justify-center font-bold text-xs text-brand-400 shrink-0">
                          {meta.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <Input
                                value={editLabelText}
                                onChange={(e) => setEditLabelText(e.target.value)}
                                className="h-7 text-xs bg-[#191919] border-[#3a3a3a]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(k.id)}
                                className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-[#f4f4f2] truncate">
                                {k.label}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#191919] text-[#9a9a94] border border-[#303030]">
                                {meta.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#9a9a94] font-mono">
                            <span>••••••••{k.keyLast4}</span>
                            <span>•</span>
                            <span
                              className={`flex items-center gap-1 ${
                                k.status === 'active'
                                  ? 'text-emerald-400'
                                  : 'text-red-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  k.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'
                                }`}
                              />
                              {k.status === 'active' ? 'Active' : 'Invalid'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {meta.usageUrl && (
                          <a
                            href={meta.usageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-display font-medium bg-[#191919] border border-[#303030] text-[#9a9a94] hover:text-amber-300 hover:border-amber-500/40 transition"
                            title={`View ${meta.name} usage & limits`}
                          >
                            <Activity className="w-3 h-3 text-amber-400" />
                            <span className="hidden sm:inline">View Usage</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#9a9a94]" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCheckModelsForKey(k.id, k.provider)}
                          disabled={discoveringKeyId === k.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-display font-medium bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20 transition cursor-pointer"
                          title="Test and list supported models for this key"
                        >
                          <Sparkles className={`w-3 h-3 ${discoveringKeyId === k.id ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">{discoveringKeyId === k.id ? 'Checking...' : 'Check Models'}</span>
                        </button>
                        <button
                          onClick={() => handleRetestKey(k.id)}
                          disabled={isRetesting}
                          title="Test key connection"
                          className="p-1.5 text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#191919] rounded-lg transition cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isRetesting ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => {
                            setEditingKeyId(k.id);
                            setEditLabelText(k.label);
                          }}
                          title="Rename key"
                          className="p-1.5 text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#191919] rounded-lg transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(k.id)}
                          title="Delete key"
                          className="p-1.5 text-[#9a9a94] hover:text-red-400 hover:bg-[#191919] rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
    </Dialog>
  );
}
