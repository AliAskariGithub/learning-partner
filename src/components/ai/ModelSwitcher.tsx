'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Sparkles,
  Key,
  Check,
  Eye,
  Mic,
  Headphones,
  Lock,
  Activity,
  ExternalLink,
  Bot,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  PROVIDER_REGISTRY,
  MODEL_CATALOG,
  ModelDefinition,
  ProviderId,
  getModelDefinition,
} from '@/lib/ai/providers';
import { SafeApiKey } from '@/app/app/api-key-actions';
import { SafeConnection } from '@/lib/connections/types';
import { getUserConnections } from '@/app/app/connection-actions';
import { Tooltip } from '@/components/ui/tooltip';
import { GlidingHighlight } from '@/components/ui/DirectionalHover';

interface ModelSwitcherProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  userKeys?: SafeApiKey[];
  connections?: SafeConnection[];
  onOpenManageKeys: () => void;
  disabled?: boolean;
  notebookId?: string;
}

export function ModelSwitcher({
  selectedModelId,
  onSelectModel,
  userKeys = [],
  connections: propConnections,
  onOpenManageKeys,
  disabled = false,
  notebookId,
}: ModelSwitcherProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
  const [loadedConnections, setLoadedConnections] = useState<SafeConnection[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch connections if not passed from props
  useEffect(() => {
    if (propConnections && propConnections.length > 0) {
      setLoadedConnections(propConnections);
    } else {
      getUserConnections()
        .then((conns) => {
          if (conns && conns.length > 0) {
            setLoadedConnections(conns);
          }
        })
        .catch(() => {});
    }
  }, [propConnections]);

  // Remember and restore last used model per notebook
  useEffect(() => {
    if (!notebookId) return;
    try {
      const saved = localStorage.getItem(`lp_model_${notebookId}`);
      if (saved && saved !== selectedModelId && MODEL_CATALOG.some((m) => m.id === saved)) {
        onSelectModel(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [notebookId]);

  const activeModel = getModelDefinition(selectedModelId);

  // Determine active connections list
  const activeConnections = propConnections || loadedConnections;

  // Helper to map model to its funding connection
  const getFundingConnection = (model: ModelDefinition): SafeConnection | null => {
    if (activeConnections.length > 0) {
      if (model.provider === 'google') {
        return activeConnections.find((c) => c.provider === 'gemini') || null;
      }
      if (model.provider === 'openai') {
        // Prefer active ChatGPT plan, then OpenAI key
        return (
          activeConnections.find((c) => c.provider === 'chatgpt' && c.status === 'connected') ||
          activeConnections.find((c) => c.provider === 'openai') ||
          activeConnections.find((c) => c.provider === 'chatgpt') ||
          null
        );
      }
      if (model.provider === 'anthropic') {
        return activeConnections.find((c) => c.provider === 'anthropic') || null;
      }
      if (model.provider === 'openrouter') {
        return activeConnections.find((c) => c.provider === 'openrouter') || null;
      }
      if (model.provider === 'custom') {
        return (
          activeConnections.find((c) => c.provider === 'custom') ||
          activeConnections.find((c) => c.provider === 'omniroute') ||
          null
        );
      }
    }

    // Fallback to legacy userKeys
    const legacyKey = userKeys.find((k) => k.provider === model.provider);
    if (legacyKey) {
      return {
        id: legacyKey.id,
        provider: (legacyKey.provider === 'google' ? 'gemini' : legacyKey.provider) as any,
        method: 'api_key',
        callMode: 'server',
        baseUrl: null,
        status: 'connected',
        accessTokenExpiresAt: null,
        grantedScopes: null,
        accountLabel: `${legacyKey.provider.toUpperCase()} Key`,
        lastError: null,
        lastUsedAt: null,
        isDefault: false,
        autoFallback: false,
        createdAt: legacyKey.createdAt,
      };
    }

    return null;
  };

  const hasAnyConnection =
    activeConnections.length > 0 || userKeys.length > 0;

  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelDefinition[]> = {
      google: MODEL_CATALOG.filter((m) => m.provider === 'google'),
      openai: MODEL_CATALOG.filter((m) => m.provider === 'openai'),
      anthropic: MODEL_CATALOG.filter((m) => m.provider === 'anthropic'),
      openrouter: [...MODEL_CATALOG.filter((m) => m.provider === 'openrouter')],
      custom: [...MODEL_CATALOG.filter((m) => m.provider === 'custom')],
    };

    // Dynamically inject custom configured models from active connections
    for (const conn of activeConnections) {
      if (conn.provider === 'openrouter' && conn.configuredModel) {
        const id = conn.configuredModel;
        if (!groups.openrouter.some((m) => m.id === id)) {
          const namePart = id.includes('/') ? id.split('/')[1] : id;
          const formattedName = `${namePart.charAt(0).toUpperCase() + namePart.slice(1)} (OpenRouter)`;
          groups.openrouter.unshift({
            id,
            name: formattedName,
            provider: 'openrouter',
            description: `Configured OpenRouter model: ${id}`,
            capabilities: {
              text: true,
              vision: false,
              audioInput: false,
              audioOutput: false,
              structuredOutput: true,
              toolUse: true,
              embeddings: false,
              contextWindow: 65536,
            },
          });
        }
      }

      if (conn.provider === 'custom' && conn.configuredModel) {
        const id = conn.configuredModel;
        if (!groups.custom.some((m) => m.id === id)) {
          groups.custom.unshift({
            id,
            name: `${id} (Custom)`,
            provider: 'custom',
            description: `Custom endpoint model: ${id}`,
            capabilities: {
              text: true,
              vision: false,
              audioInput: false,
              audioOutput: false,
              structuredOutput: true,
              toolUse: true,
              embeddings: false,
              contextWindow: 32768,
            },
          });
        }
      }
    }

    return groups;
  }, [activeConnections]);

  // Sort provider groups so CONNECTED providers are automatically brought to the top!
  const sortedProviderIds = useMemo(() => {
    const providers = ['google', 'openai', 'anthropic', 'openrouter', 'custom'];
    return providers.sort((a, b) => {
      const aConnected =
        activeConnections.some((c) => {
          if (a === 'google') return c.provider === 'gemini';
          if (a === 'openai') return c.provider === 'openai' || c.provider === 'chatgpt';
          return c.provider === a;
        }) || userKeys.some((k) => k.provider === a);

      const bConnected =
        activeConnections.some((c) => {
          if (b === 'google') return c.provider === 'gemini';
          if (b === 'openai') return c.provider === 'openai' || c.provider === 'chatgpt';
          return c.provider === b;
        }) || userKeys.some((k) => k.provider === b);

      if (aConnected && !bConnected) return -1;
      if (!aConnected && bConnected) return 1;
      return 0;
    });
  }, [activeConnections, userKeys]);

  const formatContextSize = (tokens: number) => {
    if (tokens >= 1000000) return `${Math.round(tokens / 1000000)}M`;
    return `${Math.round(tokens / 1000)}k`;
  };

  const handleSelect = (modelId: string) => {
    if (notebookId) {
      try {
        localStorage.setItem(`lp_model_${notebookId}`, modelId);
      } catch {}
    }
    onSelectModel(modelId);
    setDropdownOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <Tooltip
        content={
          hasAnyConnection
            ? `Active Model: ${activeModel.name} · Click to switch`
            : 'Configure your AI connection (Gemini Key or ChatGPT)'
        }
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-medium transition-all cursor-pointer shadow-sm disabled:opacity-50 ${
            !hasAnyConnection
              ? 'text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30'
              : 'text-[#f4f4f2] bg-[#262626] hover:bg-[#303030] border border-[#3a3a3a]'
          }`}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          {!hasAnyConnection && <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
          <span className="truncate max-w-[110px] sm:max-w-[160px]">
            {hasAnyConnection ? activeModel.name : 'Configure Modal'}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#9a9a94] transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180 text-purple-400' : ''
            }`}
          />
        </button>
      </Tooltip>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          className="absolute left-0 bottom-full mb-2 w-[calc(100vw-32px)] sm:w-80 max-w-[340px] rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl p-2.5 z-50 text-xs text-[#f4f4f2] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-[55vh] sm:max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#303030]"
          onMouseLeave={() => setHoveredModelId(null)}
        >
          {!hasAnyConnection ? (
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-bold text-xs text-[#f4f4f2]">
                  Configure Modal
                </p>
                <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                  Add your Gemini Key (Recommended) or connect with ChatGPT to power your study assistant.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenManageKeys();
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-display font-semibold text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Configure Modal
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                <span>Select AI Model</span>
                <span className="text-[9px] font-mono lowercase opacity-70">
                  grouped by connection
                </span>
              </div>

              <div className="space-y-3 my-1">
                {sortedProviderIds.map((pId) => {
                  const models = groupedModels[pId];
                  const providerMeta = (PROVIDER_REGISTRY as any)[pId];
                  if (!models || models.length === 0 || !providerMeta) return null;

                  const sortedModels = [...models].sort((a, b) => {
                    const aConn = getFundingConnection(a);
                    const bConn = getFundingConnection(b);
                    if (aConn && !bConn) return -1;
                    if (!aConn && bConn) return 1;
                    return 0;
                  });

                  return (
                    <div key={pId} className="space-y-1">
                      {/* Provider Header */}
                      <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] font-display font-bold text-[#9a9a94]">
                        <span className="flex items-center gap-1.5">
                          {providerMeta.name}
                        </span>
                        {providerMeta.usageUrl && (
                          <a
                            href={providerMeta.usageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline font-mono"
                            title={`View ${providerMeta.name} limits & pricing`}
                          >
                            <Activity className="w-2.5 h-2.5" />
                            Usage
                            <ExternalLink className="w-2 h-2 text-amber-400/70" />
                          </a>
                        )}
                      </div>

                      {/* Model List with directional gliding highlight */}
                      <div className="space-y-0.5 relative">
                        {sortedModels.map((m) => {
                          const isSelected = selectedModelId === m.id;
                          const fundingConn = getFundingConnection(m);
                          const isConnected = !!fundingConn;
                          const isCapped = fundingConn?.status === 'capped_or_exhausted';
                          const isNotEligible = fundingConn?.status === 'not_eligible';
                          const isRevoked =
                            fundingConn?.status === 'revoked' || fundingConn?.status === 'expired';

                          const canSelect = isConnected && !isCapped && !isNotEligible && !isRevoked;

                          // Format funding label
                          let fundingLabel = 'No connection';
                          if (fundingConn) {
                            if (fundingConn.provider === 'chatgpt') {
                              fundingLabel = 'ChatGPT Plan';
                            } else if (fundingConn.provider === 'gemini') {
                              fundingLabel = 'Gemini Key';
                            } else if (fundingConn.provider === 'openai') {
                              fundingLabel = 'OpenAI Key';
                            } else if (fundingConn.provider === 'anthropic') {
                              fundingLabel = 'Anthropic Key';
                            } else if (fundingConn.provider === 'openrouter') {
                              fundingLabel = 'OpenRouter';
                            } else {
                              fundingLabel = fundingConn.accountLabel || 'Custom';
                            }
                          }

                          return (
                            <div
                              key={m.id}
                              className="relative"
                              onMouseEnter={() => setHoveredModelId(m.id)}
                            >
                              <GlidingHighlight
                                activeId={isSelected ? m.id : null}
                                hoverId={hoveredModelId}
                                itemId={m.id}
                                layoutId="model-list-glide"
                                className={
                                  isSelected
                                    ? 'bg-purple-500/20 border border-purple-500/40'
                                    : 'bg-[#262626] border border-[#383838]'
                                }
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isConnected) {
                                    setDropdownOpen(false);
                                    onOpenManageKeys();
                                    return;
                                  }
                                  if (canSelect) {
                                    handleSelect(m.id);
                                  }
                                }}
                                disabled={isConnected && !canSelect}
                                className={`relative z-10 w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-purple-300 font-semibold'
                                    : canSelect
                                    ? 'text-[#f4f4f2]'
                                    : 'opacity-50 text-[#9a9a94]'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{m.name}</span>
                                    {isSelected && (
                                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                    )}

                                    {/* Connection funding badge */}
                                    {isConnected && (
                                      <span
                                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                          isCapped
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : isNotEligible || isRevoked
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            : 'bg-[#191919] text-[#9a9a94] border border-[#303030]'
                                        }`}
                                      >
                                        {isCapped
                                          ? 'Limit reached'
                                          : isNotEligible
                                          ? 'Plus/Pro required'
                                          : isRevoked
                                          ? 'Reconnect'
                                          : fundingLabel}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#9a9a94]">
                                    <Tooltip
                                      content={`Context Window: ${formatContextSize(
                                        m.capabilities.contextWindow
                                      )} tokens`}
                                    >
                                      <span className="font-mono bg-[#191919] px-1.5 py-0.2 rounded border border-[#303030]">
                                        {formatContextSize(m.capabilities.contextWindow)}
                                      </span>
                                    </Tooltip>
                                    {m.capabilities.vision && (
                                      <Tooltip content="Vision: Understands diagrams, charts & images">
                                        <span>
                                          <Eye className="w-3 h-3 text-cyan-400" />
                                        </span>
                                      </Tooltip>
                                    )}
                                    {m.capabilities.audioInput && (
                                      <Tooltip content="Audio Input: Understands speech and spoken queries">
                                        <span>
                                          <Mic className="w-3 h-3 text-amber-400" />
                                        </span>
                                      </Tooltip>
                                    )}
                                    {m.capabilities.audioOutput && (
                                      <Tooltip content="Audio Output: Generates voice podcasts & audio overviews">
                                        <span>
                                          <Headphones className="w-3 h-3 text-purple-400" />
                                        </span>
                                      </Tooltip>
                                    )}
                                    {m.capabilities.structuredOutput && (
                                      <Tooltip content="Structured Output: Generates quizzes, flashcards & mind maps">
                                        <span>
                                          <Sparkles className="w-3 h-3 text-emerald-400" />
                                        </span>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>

                                {!isConnected && (
                                  <Tooltip content={`Connect ${providerMeta.name} to unlock`}>
                                    <span className="text-[10px] text-purple-400 hover:underline shrink-0 font-display font-medium">
                                      Connect
                                    </span>
                                  </Tooltip>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 border-t border-[#303030] mt-1 space-y-1">
                <Tooltip content="Manage Gemini keys, ChatGPT plan, and other AI connections">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenManageKeys();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-display font-medium text-purple-400 hover:text-purple-300 hover:bg-[#262626] transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Connect AI &amp; Connections...</span>
                    </span>
                    <ChevronDown className="w-3 h-3 -rotate-90" />
                  </button>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
