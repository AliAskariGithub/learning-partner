'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { updateProfileSettings } from '@/app/settings/actions';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Brain,
  User as UserIcon,
  Key,
  ExternalLink,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  LogOut,
  Globe,
  Settings,
} from 'lucide-react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English (English)' },
  { code: 'es', label: 'Español (Spanish)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'ar', label: 'العربية (Arabic)' },
  { code: 'ur', label: 'اردو (Urdu)' },
  { code: 'zh', label: '中文 (Chinese)' },
  { code: 'ja', label: '日本語 (Japanese)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'pt', label: 'Português (Portuguese)' },
  { code: 'it', label: 'Italiano (Italian)' },
  { code: 'ru', label: 'Русский (Russian)' },
];

interface GeminiSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name?: string | null; email?: string | null };
  initialDisplayName: string;
  initialInstructions: string;
  initialLanguage: string;
}

export function GeminiSettingsModal({
  open,
  onOpenChange,
  user,
  initialDisplayName,
  initialInstructions,
  initialLanguage,
}: GeminiSettingsModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [settingsTab, setSettingsTab] = useState<'gemini' | 'instructions' | 'account'>('gemini');

  // Gemini BYO settings
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro (BYO Key)');
  const [geminiTemperature, setGeminiTemperature] = useState(0.2);
  const [testingKey, setTestingKey] = useState(false);

  // Profile and Instructions
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) setGeminiApiKey(savedKey);
      const savedModel = localStorage.getItem('gemini_selected_model');
      if (savedModel) setSelectedModel(savedModel);
      const savedTemp = localStorage.getItem('gemini_temperature');
      if (savedTemp) setGeminiTemperature(parseFloat(savedTemp));
    } catch {
      // client storage
    }
  }, []);

  const handleTestKey = async () => {
    const key = geminiApiKey.trim();
    if (!key) {
      toast({
        title: 'API Key Missing',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Save client-side BYO key
      localStorage.setItem('gemini_api_key', geminiApiKey.trim());
      localStorage.setItem('gemini_selected_model', selectedModel);
      localStorage.setItem('gemini_temperature', geminiTemperature.toString());

      // 2. Save profile in Neon Postgres
      const fd = new FormData();
      fd.append('displayName', displayName.trim());
      fd.append('customInstructions', instructions.trim());
      fd.append('preferredLanguage', language);
      await updateProfileSettings(fd);

      toast({
        title: 'Settings Saved',
        description: 'Preferences and Gemini API settings updated successfully.',
        variant: 'success',
      });
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Settings & Gemini Configuration"
      description="Manage your Google AI Studio Gemini API key, model reasoning parameters, and custom study persona."
    >
      <div className="space-y-5">
        {/* Tab Navigation */}
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

        {/* Tab 1: Gemini API */}
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

            {/* Model Selection */}
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

            {/* Strict Grounding Temperature */}
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
                onClick={handleTestKey}
                isLoading={testingKey}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Test Connection
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={saving}
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
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
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
                    onClick={() => setInstructions(p.text)}
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
                isLoading={saving}
                onClick={handleSave}
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
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-brand-400" />
                <span>Preferred Study Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-xl px-3 py-2 text-xs font-display text-foreground focus:outline-none focus:border-brand-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-surface text-foreground">
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push('/settings');
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-surface-raised border border-border hover:border-brand-500/40 text-xs text-foreground transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5 text-brand-400" />
                <span className="font-display font-medium">Open Full Profile &amp; Settings Page</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            <div className="p-3 rounded-xl bg-surface-raised border border-border space-y-1">
              <div className="font-display font-bold text-foreground">Database Storage</div>
              <p className="text-[11.5px] text-muted-foreground font-serif">
                Connected to Neon Serverless Postgres (`branch: production`). Notebooks, sources, chunks, and notes persist in cloud PostgreSQL.
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
                isLoading={saving}
                onClick={handleSave}
              >
                Save Profile
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
