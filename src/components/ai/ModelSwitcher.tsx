'use client';

import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import {
  PROVIDER_REGISTRY,
  MODEL_CATALOG,
  ModelDefinition,
  ProviderId,
  getModelDefinition,
} from '@/lib/ai/providers';
import { SafeApiKey } from '@/app/app/api-key-actions';
import { Tooltip } from '@/components/ui/tooltip';
import { GlidingHighlight } from '@/components/ui/DirectionalHover';

interface ModelSwitcherProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  userKeys: SafeApiKey[];
  onOpenManageKeys: () => void;
  disabled?: boolean;
}

export function ModelSwitcher({
  selectedModelId,
  onSelectModel,
  userKeys,
  onOpenManageKeys,
  disabled = false,
}: ModelSwitcherProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredModelId, setHoveredModelId] = useState<string | null>(null);
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

  const activeModel = getModelDefinition(selectedModelId);

  // Group models by connected provider
  const connectedProviders = new Set(userKeys.map((k) => k.provider));
  const hasAnyKey = userKeys.length > 0;

  const groupedModels: Record<ProviderId, ModelDefinition[]> = {
    google: MODEL_CATALOG.filter((m) => m.provider === 'google'),
    anthropic: MODEL_CATALOG.filter((m) => m.provider === 'anthropic'),
    openai: MODEL_CATALOG.filter((m) => m.provider === 'openai'),
    groq: MODEL_CATALOG.filter((m) => m.provider === 'groq'),
    openrouter: MODEL_CATALOG.filter((m) => m.provider === 'openrouter'),
    custom: MODEL_CATALOG.filter((m) => m.provider === 'custom'),
  };

  const formatContextSize = (tokens: number) => {
    if (tokens >= 1000000) return `${Math.round(tokens / 1000000)}M`;
    return `${Math.round(tokens / 1000)}k`;
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <Tooltip content={`Active Model: ${activeModel.name} · Click to switch`}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-display font-medium text-[#f4f4f2] bg-[#262626] hover:bg-[#303030] border border-[#3a3a3a] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span className="truncate max-w-[140px]">{activeModel.name}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#9a9a94] transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </Tooltip>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl p-2 z-50 text-xs text-[#f4f4f2] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-[#303030]"
          onMouseLeave={() => setHoveredModelId(null)}
        >
          {!hasAnyKey ? (
            <div className="p-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-bold text-xs text-[#f4f4f2]">
                  No API Keys Connected
                </p>
                <p className="text-[11px] text-[#9a9a94] font-serif mt-1 leading-snug">
                  Add your OpenAI, Anthropic, Gemini, or Groq key to enable AI models.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenManageKeys();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-xs transition cursor-pointer shadow-md"
              >
                Connect API Key
              </button>
            </div>
          ) : (
            <>
              <div className="px-2 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-[#9a9a94]">
                Select AI Model
              </div>

              <div className="space-y-3 my-1">
                {(Object.keys(groupedModels) as ProviderId[]).map((pId) => {
                  const models = groupedModels[pId];
                  const providerMeta = PROVIDER_REGISTRY[pId];
                  const isConnected = connectedProviders.has(pId);

                  if (models.length === 0) return null;

                  return (
                    <div key={pId} className="space-y-1">
                      {/* Provider Header */}
                      <div className="flex items-center justify-between px-2 pt-1 text-[11px] font-display font-bold text-[#9a9a94]">
                        <span className="flex items-center gap-1.5">
                          {providerMeta.name}
                        </span>
                        <div className="flex items-center gap-2">
                          {isConnected && providerMeta.usageUrl && (
                            <a
                              href={providerMeta.usageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline font-mono"
                              title={`View ${providerMeta.name} usage & rate limits`}
                            >
                              <Activity className="w-2.5 h-2.5" />
                              View Usage
                              <ExternalLink className="w-2 h-2 text-amber-400/70" />
                            </a>
                          )}
                          {!isConnected && (
                            <span className="text-[9px] text-[#71717a] font-normal flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> No key
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Model List with directional gliding highlight */}
                      <div className="space-y-0.5 relative">
                        {models.map((m) => {
                          const isSelected = selectedModelId === m.id;

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
                                className={isSelected ? 'bg-brand-500/20 border border-brand-500/40' : 'bg-[#262626] border border-[#383838]'}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isConnected) {
                                    setDropdownOpen(false);
                                    onOpenManageKeys();
                                    return;
                                  }
                                  onSelectModel(m.id);
                                  setDropdownOpen(false);
                                }}
                                className={`relative z-10 w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'text-brand-300 font-semibold'
                                    : isConnected
                                    ? 'text-[#f4f4f2]'
                                    : 'opacity-50 text-[#9a9a94]'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate">{m.name}</span>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#9a9a94]">
                                    <Tooltip content={`Context Window: ${formatContextSize(m.capabilities.contextWindow)} tokens`}>
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
                                  <Tooltip content={`Add your ${providerMeta.name} key to unlock`}>
                                    <span className="text-[10px] text-brand-400 hover:underline shrink-0">
                                      Connect key
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
                {PROVIDER_REGISTRY[activeModel.provider]?.usageUrl && (
                  <a
                    href={PROVIDER_REGISTRY[activeModel.provider].usageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-display font-medium text-amber-400 hover:text-amber-300 hover:bg-[#262626] transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5" />
                      <span>View Usage ({PROVIDER_REGISTRY[activeModel.provider].name})</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-amber-400/70" />
                  </a>
                )}

                <Tooltip content="Configure custom keys, discover models & test quotas">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenManageKeys();
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-display font-medium text-brand-400 hover:text-brand-300 hover:bg-[#262626] transition cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Manage API Keys & Models...</span>
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
