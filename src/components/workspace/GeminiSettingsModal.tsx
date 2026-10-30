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

const PRESETS = [
  {
    title: 'Socratic Tutor',
    text: 'Act as a patient, encouraging Socratic tutor. Break complex concepts into relatable real-world analogies, and challenge me with 1 reflection question at the end of each topic.',
  },
  {
    title: 'Technical Deep-Dive',
    text: 'Prioritize deep technical rigor, time/space complexity analysis, production-grade TypeScript/Python snippets, and explicit architectural trade-offs.',
  },
  {
    title: 'Executive Briefing',
    text: 'Format responses as concise executive briefings. Use bold bullet points, clear headings, and structured comparison tables. Eliminate conversational filler.',
  },
  {
    title: 'Exam Preparation',
    text: 'Help me master the material for exams. Highlight common pitfalls, tricky edge cases, and test my understanding with rapid active recall prompts.',
  },
];

interface GeminiSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name?: string | null; email?: string | null };
  initialDisplayName: string;
  initialInstructions: string;
  initialLanguage: string;
  initialTab?: 'account' | 'instructions' | 'gemini';
}

export function GeminiSettingsModal({
  open,
  onOpenChange,
  user,
  initialDisplayName,
  initialInstructions,
  initialLanguage,
  initialTab = 'account',
}: GeminiSettingsModalProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [settingsTab, setSettingsTab] = useState<'account' | 'instructions' | 'gemini'>(initialTab);

  // Profile and Instructions
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [language, setLanguage] = useState(initialLanguage);
  const [saving, setSaving] = useState(false);

  // Gemini BYO settings
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 1.5 Pro (BYO Key)');
  const [geminiTemperature, setGeminiTemperature] = useState(0.2);
  const [testingKey, setTestingKey] = useState(false);

  useEffect(() => {
    setSettingsTab(initialTab);
    setDisplayName(initialDisplayName);
    setInstructions(initialInstructions);
    setLanguage(initialLanguage);
  }, [open, initialTab, initialDisplayName, initialInstructions, initialLanguage]);

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
      // 1. Save client-side BYO key if provided
      if (geminiApiKey.trim()) {
        localStorage.setItem('gemini_api_key', geminiApiKey.trim());
        localStorage.setItem('gemini_selected_model', selectedModel);
        localStorage.setItem('gemini_temperature', geminiTemperature.toString());
      }

      // 2. Save profile in Neon Postgres
      const fd = new FormData();
      fd.append('displayName', displayName.trim());
      fd.append('customInstructions', instructions.trim());
      fd.append('preferredLanguage', language);
      await updateProfileSettings(fd);

      toast({
        title: 'Profile & Settings Saved',
        description: 'Your user profile and preferences have been updated.',
        variant: 'success',
      });

      // Automatically close modal after completing action
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err?.message || 'Failed to save settings.',
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
      title="User Profile & Settings"
      description="Manage your learner identity, preferred study language, custom instructions, and AI connections."
      className="max-w-xl max-h-[92dvh] sm:max-h-[88vh] overflow-hidden flex flex-col p-4 sm:p-6"
    >
      <div className="space-y-4 flex-1 min-h-0 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex items-center border-b border-border pb-2 gap-1.5 sm:gap-2 text-xs font-display font-semibold shrink-0 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            onClick={() => setSettingsTab('account')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              settingsTab === 'account'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setSettingsTab('instructions')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              settingsTab === 'instructions'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Brain className="h-3.5 w-3.5" />
            <span>Instructions</span>
          </button>

          <button
            onClick={() => setSettingsTab('gemini')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0 ${
              settingsTab === 'gemini'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Connection</span>
          </button>
        </div>

        {/* Tab 1: User Profile (Accessible with zero API keys) */}
        {settingsTab === 'account' && (
          <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto pr-1 py-1 scrollbar-thin scrollbar-thumb-[#383838]">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your Name"
                className="text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Account Email
              </label>
              <Input
                value={user.email || 'user@example.com'}
                disabled
                className="opacity-70 bg-surface-raised font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-purple-400" />
                <span>Preferred Study Language</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-[#383838] rounded-xl px-3 py-2 text-xs font-display text-foreground focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#1e1e1e] text-foreground">
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
              className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#222222] border border-[#333333] hover:border-purple-500/40 text-xs text-foreground transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <Settings className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                <span className="font-display font-medium truncate">Open Full Profile &amp; Preferences Page</span>
              </div>
              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </button>

            <div className="p-3 rounded-xl bg-[#222222] border border-[#333333] space-y-1">
              <div className="font-display font-bold text-foreground">Database Storage</div>
              <p className="text-[11.5px] text-muted-foreground font-serif leading-relaxed">
                Connected to Neon Serverless Postgres. Your identity, notebooks, and learning preferences are safely synced to your account.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border shrink-0 gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sign Out
              </Button>

              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                onClick={handleSave}
                className="text-xs font-display font-semibold"
              >
                Save Profile
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: Instructions */}
        {settingsTab === 'instructions' && (
          <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto pr-1 py-1 scrollbar-thin scrollbar-thumb-[#383838]">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Custom Grounding Instructions
              </label>
              <p className="text-xs text-muted-foreground font-serif mb-2 leading-relaxed">
                Provide custom instructions on how your AI study partner should answer your questions, explain complex ideas, or challenge you.
              </p>
              <Textarea
                rows={5}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Always explain like I am a beginner, provide real-world analogies, and quiz me at the end of every answer..."
                className="text-xs font-serif leading-relaxed"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Quick Presets:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => setInstructions(p.text)}
                    className="p-2.5 rounded-xl border border-border bg-[#222222] hover:border-purple-500/40 text-left transition cursor-pointer"
                  >
                    <p className="font-display font-bold text-xs text-[#f4f4f2]">{p.title}</p>
                    <p className="text-[10.5px] text-muted-foreground font-serif line-clamp-2 mt-0.5">
                      {p.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border shrink-0">
              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                onClick={handleSave}
                className="text-xs font-display font-semibold"
              >
                Save Instructions
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: AI Connection */}
        {settingsTab === 'gemini' && (
          <div className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto pr-1 py-1 scrollbar-thin scrollbar-thumb-[#383838]">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
              <div className="font-display font-bold text-purple-300 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Gemini API Connection</span>
              </div>
              <p className="text-xs text-[#dcdcd8] font-serif leading-relaxed">
                Connect your personal API key from Google AI Studio to power fast source grounding, quizzes, and podcast voice overviews.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-display font-semibold uppercase tracking-wider text-muted-foreground text-[11px] flex items-center gap-1">
                  <Key className="h-3 w-3 text-purple-400" />
                  <span>Google AI Studio API Key</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-display flex items-center gap-1 hover:underline text-[11px]"
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
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border shrink-0 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestKey}
                disabled={testingKey || !geminiApiKey.trim()}
                className="text-xs"
              >
                {testingKey ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                Test Key
              </Button>

              <Button
                variant="primary"
                size="sm"
                isLoading={saving}
                onClick={handleSave}
                className="text-xs font-display font-semibold"
              >
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
