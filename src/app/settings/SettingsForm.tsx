'use client';

import React, { useState, useEffect, useRef } from 'react';
import { updateProfileSettings, exportUserData, deleteAccountAndData } from './actions';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Dialog,
} from '@/components/ui';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { Profile } from '@/db/schema';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { useTheme } from 'next-themes';
import {
  Save,
  Key,
  ExternalLink,
  Sparkles,
  Brain,
  User as UserIcon,
  Globe,
  RefreshCw,
  Camera,
  Upload,
  Trash2,
  Sliders,
  Sun,
  Moon,
  Laptop,
  Database,
  Download,
  AlertTriangle,
  Headphones,
  Check,
  LogOut,
  Palette,
  Bot,
  Shield,
  ShieldAlert,
  Cookie,
} from 'lucide-react';
import { ConnectAiDialog } from '@/components/ai/ConnectAiDialog';
import {
  getUserConnections,
  disconnectConnection,
  testConnection,
  setDefaultConnection,
  toggleAutoFallback,
} from '@/app/app/connection-actions';
import { SafeConnection } from '@/lib/connections/types';
import { useConsent } from '@/hooks/useConsent';
import { COOKIE_CATEGORIES, COOKIE_REGISTRY, CookieCategory } from '@/config/cookies';

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

const EXAMPLE_INSTRUCTIONS = [
  {
    title: 'Socratic Tutor',
    desc: 'Guides with questions and analogies before giving answers.',
    text: 'Act as a patient, encouraging Socratic tutor. Break complex concepts into relatable real-world analogies, and challenge me with 1 reflection question at the end of each topic.',
  },
  {
    title: 'Technical Deep-Dive',
    desc: 'Mathematical rigor, architecture diagrams & clean code.',
    text: 'Prioritize deep technical rigor, time/space complexity analysis, production-grade TypeScript/Python snippets, and explicit architectural trade-offs.',
  },
  {
    title: 'Executive Briefing',
    desc: 'High-signal, bulleted summaries for fast scanning.',
    text: 'Format responses as concise executive briefings. Use bold bullet points, clear headings, and structured comparison tables. Eliminate conversational filler.',
  },
  {
    title: 'Exam Preparation',
    desc: 'Active recall, trap warnings, and concept checks.',
    text: 'Help me master the material for exams. Highlight common pitfalls, tricky edge cases, and test my understanding with rapid active recall prompts.',
  },
];

export function SettingsForm({
  profile,
  userEmail,
}: {
  profile: Profile;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Profile Form States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [preferredLanguage, setPreferredLanguage] = useState(
    profile.preferredLanguage || 'en'
  );
  const [customInstructions, setCustomInstructions] = useState(
    profile.customInstructions || ''
  );

  // Voice Provider Preference State
  const [voiceProviderPreference, setVoiceProviderPreference] = useState<'google' | 'openai' | 'web_speech'>('google');

  // AI Connections State
  const [manageKeysOpen, setManageKeysOpen] = useState(false);
  const [connectionsList, setConnectionsList] = useState<SafeConnection[]>([]);
  const [testingConnId, setTestingConnId] = useState<string | null>(null);

  // Consent Hook for Cookie Management
  const { consent, updateConsent, withdrawConsent, isGpc } = useConsent();

  // Data Export & Deletion State
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadUserConnections();
    const savedVoicePref = localStorage.getItem('lp_voice_provider') as any;
    if (savedVoicePref) setVoiceProviderPreference(savedVoicePref);

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
  }, []);

  const loadUserConnections = async () => {
    try {
      const conns = await getUserConnections();
      setConnectionsList(conns);
    } catch {
      // Ignored in SSR
    }
  };

  const handleVoicePrefChange = (provider: 'google' | 'openai' | 'web_speech') => {
    setVoiceProviderPreference(provider);
    localStorage.setItem('lp_voice_provider', provider);
    toast({
      title: 'Voice Provider Saved',
      description: `Default voice overview provider set to ${provider === 'web_speech' ? 'Basic Voice (Web Speech)' : provider.toUpperCase()}.`,
      variant: 'success',
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (PNG, JPG, or WebP).',
        variant: 'error',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: 'Image Too Large',
        description: 'Please select an image smaller than 8MB.',
        variant: 'warning',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        const minDim = Math.min(img.width, img.height);
        const startX = (img.width - minDim) / 2;
        const startY = (img.height - minDim) / 2;

        canvas.width = MAX_DIM;
        canvas.height = MAX_DIM;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, MAX_DIM, MAX_DIM);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setAvatarUrl(compressed);
          toast({
            title: 'Photo Selected',
            description: 'Preview updated. Click "Save Changes" to save to your profile.',
            variant: 'success',
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('displayName', displayName);
      fd.append('avatarUrl', avatarUrl);
      fd.append('preferredLanguage', preferredLanguage);
      fd.append('customInstructions', customInstructions);

      const res = await updateProfileSettings(fd);
      if (res.success) {
        toast({
          title: 'Settings Saved',
          description: 'Your profile and study preferences have been updated.',
          variant: 'success',
        });
        router.refresh();
      }
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await exportUserData();
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning-partner-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({
          title: 'Export Complete',
          description: 'All your notebooks, sources, notes, and outputs downloaded.',
          variant: 'success',
        });
      } else {
        toast({ title: 'Export Failed', description: res.error, variant: 'error' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'delete my account') return;
    setIsDeletingAccount(true);

    try {
      const res = await deleteAccountAndData();
      if (res.success) {
        try {
          localStorage.clear();
          sessionStorage.clear();
          await authClient.signOut().catch(() => {});
        } catch {}
        window.location.href = '/sign-in';
      } else {
        toast({ title: 'Delete Failed', description: res.error, variant: 'error' });
        setIsDeletingAccount(false);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'error' });
      setIsDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = '/sign-in';
    } catch (err: any) {
      toast({ title: 'Sign out error', description: err.message, variant: 'error' });
      setSigningOut(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* 5 Distinct Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex overflow-x-auto no-scrollbar scrollbar-none w-full sm:grid sm:grid-cols-5 bg-[#191919] border border-[#303030] p-1.5 rounded-2xl mb-6 h-auto sm:h-12 gap-1.5 justify-start sm:justify-center">
          <TabsTrigger value="profile" className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-0 text-xs rounded-xl whitespace-nowrap shrink-0 sm:shrink">
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="instructions" className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-0 text-xs rounded-xl whitespace-nowrap shrink-0 sm:shrink">
            <Sliders className="w-3.5 h-3.5" />
            <span className="inline sm:hidden">Instructions</span>
            <span className="hidden sm:inline">Custom Instructions</span>
          </TabsTrigger>
          <TabsTrigger value="apikeys" className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-0 text-xs rounded-xl whitespace-nowrap shrink-0 sm:shrink">
            <Bot className="w-3.5 h-3.5" />
            <span>AI Connections</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-0 text-xs rounded-xl whitespace-nowrap shrink-0 sm:shrink">
            <Palette className="w-3.5 h-3.5" />
            <span className="inline sm:hidden">Theme</span>
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-0 text-xs rounded-xl whitespace-nowrap shrink-0 sm:shrink">
            <Database className="w-3.5 h-3.5" />
            <span className="inline sm:hidden">Privacy</span>
            <span className="hidden sm:inline">Data &amp; Privacy</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFILE */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>
                Update your display name, avatar picture, and default language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Photo Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 pb-4 border-b border-[#303030]">
                <div className="relative group shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName || 'Profile'}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#262626] border-2 border-brand-500/40 text-brand-400 flex items-center justify-center font-display font-extrabold text-2xl">
                      {(displayName || userEmail || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-col items-center sm:items-start">
                  <p className="font-display font-bold text-sm text-[#f4f4f2]">
                    {displayName || 'Study Scholar'}
                  </p>
                  <p className="text-xs text-[#9a9a94] font-mono mt-0.5">{userEmail}</p>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs h-7 px-2.5"
                    >
                      <Upload className="w-3 h-3 mr-1.5" />
                      Upload Photo
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarUrl('')}
                        className="text-xs h-7 px-2 text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Display Name
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                    Email Address
                  </label>
                  <Input
                    defaultValue={userEmail || ''}
                    disabled
                    className="opacity-70 bg-[#191919] cursor-not-allowed font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-brand-400" />
                  <span>Preferred Study Language</span>
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full bg-[#191919] border border-[#303030] rounded-xl px-3 py-2 text-xs font-display text-[#f4f4f2] focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-[#191919] text-[#f4f4f2]">
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CUSTOM INSTRUCTIONS */}
        <TabsContent value="instructions">
          <Card>
            <CardHeader>
              <CardTitle>Global Custom Instructions</CardTitle>
              <CardDescription>
                Set persona, tone, and formatting preferences applied globally to every notebook chat and synthesis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-1.5">
                  Your Instructions
                </label>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Always structure lessons with Socratic questions, use real-world analogies, and challenge my assumptions..."
                  rows={5}
                  className="font-serif text-xs leading-relaxed"
                />
              </div>

              {/* Example Placeholders Cards */}
              <div>
                <p className="text-[11px] font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Quick-Fill Preset Templates (Click to apply)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXAMPLE_INSTRUCTIONS.map((ex) => (
                    <div
                      key={ex.title}
                      onClick={() => {
                        setCustomInstructions(ex.text);
                        toast({
                          title: 'Template Applied',
                          description: `Set instructions to "${ex.title}". Click Save Changes to save.`,
                          variant: 'success',
                        });
                      }}
                      className="p-3.5 rounded-2xl bg-[#262626] border border-[#303030] hover:border-brand-500/50 cursor-pointer transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <h4 className="font-display font-bold text-xs text-[#f4f4f2] group-hover:text-brand-300">
                          {ex.title}
                        </h4>
                        <p className="text-[11px] text-[#9a9a94] font-serif mt-0.5 leading-snug">
                          {ex.desc}
                        </p>
                      </div>
                      <span className="text-[10px] text-brand-400 font-display font-semibold mt-2 inline-flex items-center gap-1">
                        Use Preset →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: AI CONNECTIONS & VOICE PROVIDER */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>AI Connections &amp; Providers</CardTitle>
                  <CardDescription>
                    Unified AI connection architecture. Primary Gemini &amp; ChatGPT Plan usage, plus secondary providers.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setManageKeysOpen(true)}
                  className="text-xs shrink-0 inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Connect AI
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Separate Voice Provider Selector */}
              <div className="p-4 rounded-2xl bg-[#262626] border border-[#303030]">
                <div className="flex items-center gap-2 mb-2">
                  <Headphones className="w-4 h-4 text-purple-400" />
                  <h4 className="font-display font-bold text-xs text-[#f4f4f2]">
                    Dedicated Voice Provider for Studio Overviews
                  </h4>
                </div>
                <p className="text-xs text-[#9a9a94] font-serif leading-relaxed mb-3">
                  You can use a separate provider for Text-to-Speech voice synthesis than your primary chat model.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => handleVoicePrefChange('google')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      voiceProviderPreference === 'google'
                        ? 'bg-brand-950/30 border-brand-500 text-white'
                        : 'bg-[#191919] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                    }`}
                  >
                    <p className="font-display font-bold text-xs">Google Gemini TTS</p>
                    <p className="text-[10px] mt-0.5">8 multi-speaker voices (Puck, Kore, Charon)</p>
                  </div>

                  <div
                    onClick={() => handleVoicePrefChange('openai')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      voiceProviderPreference === 'openai'
                        ? 'bg-brand-950/30 border-brand-500 text-white'
                        : 'bg-[#191919] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                    }`}
                  >
                    <p className="font-display font-bold text-xs">OpenAI TTS</p>
                    <p className="text-[10px] mt-0.5">tts-1 voices (Alloy, Echo, Nova, Fable)</p>
                  </div>

                  <div
                    onClick={() => handleVoicePrefChange('web_speech')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      voiceProviderPreference === 'web_speech'
                        ? 'bg-brand-950/30 border-brand-500 text-white'
                        : 'bg-[#191919] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                    }`}
                  >
                    <p className="font-display font-bold text-xs">Basic Voice (Free)</p>
                    <p className="text-[10px] mt-0.5">Browser speech synthesis, zero API key</p>
                  </div>
                </div>
              </div>

              {/* Active Connections List with Semantic Badges & Actions */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Active Connections ({connectionsList.length})
                </p>
                {connectionsList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-[#191919] border border-dashed border-[#303030] space-y-2">
                    <Bot className="w-8 h-8 text-[#9a9a94] mx-auto opacity-40" />
                    <p className="text-xs font-display font-bold text-[#f4f4f2]">No AI connections configured yet</p>
                    <p className="text-[11px] text-[#9a9a94] font-serif max-w-sm mx-auto">
                      Click &quot;Connect AI&quot; to set up your Google Gemini key, sign in with ChatGPT, or connect Anthropic Claude, OpenAI, OpenRouter, or Custom Configuration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {connectionsList.map((c) => {
                      const isTesting = testingConnId === c.id;

                      return (
                        <div
                          key={c.id}
                          className="p-4 rounded-2xl bg-[#191919] border border-[#303030] space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display font-bold text-sm text-[#f4f4f2]">
                                  {c.accountLabel}
                                </span>

                                {c.configuredModel && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-500/15 border border-brand-500/30 text-brand-300">
                                    Model: {c.configuredModel}
                                  </span>
                                )}

                                {/* Method Badge */}
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#262626] border border-[#383838] text-[#9a9a94]">
                                  {c.method === 'oauth_plan'
                                    ? 'Account (Plan Usage)'
                                    : c.method === 'custom_endpoint'
                                    ? 'Endpoint'
                                    : 'API Key'}
                                </span>

                                {/* Call Mode Badge if Browser Mode */}
                                {c.callMode === 'browser' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                                    Browser Mode (Localhost)
                                  </span>
                                )}

                                {/* Default Badge */}
                                {c.isDefault && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-500/15 border border-brand-500/40 text-brand-300 font-semibold">
                                    Default
                                  </span>
                                )}

                                {/* Semantic Status Badge */}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                                    c.status === 'connected'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : c.status === 'capped_or_exhausted'
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : c.status === 'not_eligible'
                                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  }`}
                                >
                                  {c.status === 'connected'
                                    ? 'Connected'
                                    : c.status === 'capped_or_exhausted'
                                    ? 'Quota Reached / Capped'
                                    : c.status === 'not_eligible'
                                    ? 'Not Eligible'
                                    : c.status === 'revoked'
                                    ? 'Revoked'
                                    : 'Error'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-[#9a9a94] font-serif">
                                <span>Provider: <strong className="text-[#f4f4f2]">{c.provider.toUpperCase()}</strong></span>
                                {c.lastUsedAt && <span>Last used: {new Date(c.lastUsedAt).toLocaleDateString()}</span>}
                              </div>

                              {c.lastError && (
                                <p className="text-[11px] text-rose-300 font-serif pt-0.5">
                                  {c.lastError}
                                </p>
                              )}
                            </div>

                            {/* Actions: Test, Set Default, Disconnect */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-start sm:justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isTesting}
                                onClick={async () => {
                                  setTestingConnId(c.id);
                                  try {
                                    const testRes = await testConnection(c.id);
                                    if (testRes.healthy) {
                                      toast({ title: 'Connection Healthy', description: 'Connection verified successfully.', variant: 'success' });
                                    } else {
                                      toast({ title: 'Check Notice', description: testRes.error || 'Connection reported issue.', variant: 'error' });
                                    }
                                    await loadUserConnections();
                                  } catch (e: any) {
                                    toast({ title: 'Test Failed', description: e.message, variant: 'error' });
                                  } finally {
                                    setTestingConnId(null);
                                  }
                                }}
                                className="text-[11px] h-7 px-2.5 border border-[#333333] hover:border-brand-500"
                              >
                                {isTesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Test'}
                              </Button>

                              {!c.isDefault && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    await setDefaultConnection(c.id);
                                    await loadUserConnections();
                                    toast({ title: 'Default Updated', description: 'Connection set as default.', variant: 'success' });
                                  }}
                                  className="text-[11px] h-7 px-2.5 border border-[#333333] hover:border-brand-500"
                                >
                                  Set Default
                                </Button>
                              )}

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Disconnect ${c.accountLabel}? Tokens will be revoked.`)) {
                                    await disconnectConnection(c.id);
                                    await loadUserConnections();
                                    toast({ title: 'Disconnected', description: 'Connection removed and revoked.', variant: 'success' });
                                  }
                                }}
                                className="text-[11px] h-7 px-2.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Opt-in Automatic Fallback Toggle for ChatGPT */}
                          {c.provider === 'chatgpt' && (
                            <div className="pt-2 border-t border-[#262626] flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                              <div className="text-[11px] text-[#9a9a94] font-serif">
                                <span className="text-[#f4f4f2] font-semibold">Automatic Fallback to Gemini Key:</span>{' '}
                                When ChatGPT plan allowance is capped, automatically fall back to your connected Gemini Key.
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={c.autoFallback}
                                onClick={async () => {
                                  await toggleAutoFallback(c.id, !c.autoFallback);
                                  await loadUserConnections();
                                  toast({
                                    title: 'Fallback Preference Updated',
                                    description: !c.autoFallback
                                      ? 'Automatic fallback to Gemini key enabled.'
                                      : 'Automatic fallback disabled.',
                                    variant: 'success',
                                  });
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                  c.autoFallback ? 'bg-brand-500' : 'bg-[#333333]'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    c.autoFallback ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: APPEARANCE */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance &amp; Theme</CardTitle>
              <CardDescription>
                Customize theme mode and visual accessibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-brand-400" />
                  <p className="font-display font-bold text-xs">Dark Mode</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Warm Claude Charcoal</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-amber-400" />
                  <p className="font-display font-bold text-xs">Light Mode</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Clean Crisp Ivory</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-3.5 sm:p-4 rounded-2xl border text-center transition-all ${
                    theme === 'system'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Laptop className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-cyan-400" />
                  <p className="font-display font-bold text-xs">System Match</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Sync with OS Theme</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: DATA & PRIVACY */}
        <TabsContent value="data" className="space-y-6">
          {/* Privacy & Cookie Management */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Cookie className="w-5 h-5 text-amber-400" />
                    Privacy &amp; Cookie Preferences
                  </CardTitle>
                  <CardDescription>
                    Control what cookies and local storage tokens Learning Partner can store on your device.
                  </CardDescription>
                </div>
                <a
                  href="/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-display shrink-0"
                >
                  Full Cookie Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isGpc && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-amber-300">Global Privacy Control (GPC) Signal Detected</p>
                    <p className="text-[#dcdcd8] mt-0.5 leading-relaxed font-serif">
                      Your browser has broadcast an automated opt-out signal. All non-essential preference cookies and tracking are automatically disabled by default.
                    </p>
                  </div>
                </div>
              )}

              {/* Categories */}
              <div className="space-y-3">
                {/* Strictly Necessary */}
                <div className="p-3.5 rounded-xl bg-[#262626] border border-[#303030] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#f4f4f2] font-display">Essential / Strictly Necessary</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">
                        Always Active
                      </span>
                    </div>
                    <p className="text-xs text-[#9a9a94] font-serif">
                      Required for secure authentication via Neon Auth (lp_session), CSRF protection, and recording cookie consent preferences. Cannot be disabled.
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="p-3.5 rounded-xl bg-[#262626] border border-[#303030] flex items-center justify-between">
                  <div className="space-y-0.5 pr-4">
                    <span className="text-xs font-bold text-[#f4f4f2] font-display">Preference Cookies</span>
                    <p className="text-xs text-[#9a9a94] font-serif">
                      Remembers your UI theme (dark / light / warm charcoal) and chosen interface language across visits without requiring database lookups.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={consent?.categories.preferences ?? false}
                      onChange={(e) => {
                        updateConsent({
                          preferences: e.target.checked,
                          analytics: consent?.categories.analytics ?? false,
                        });
                        toast({
                          title: e.target.checked ? 'Preferences Saved' : 'Preferences Disabled',
                          description: e.target.checked
                            ? 'Preference cookies enabled.'
                            : 'Preference cookies disabled and purged.',
                        });
                      }}
                    />
                    <div className="w-10 h-5 bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {/* Analytics */}
                <div className="p-3.5 rounded-xl bg-[#262626] border border-[#303030] flex items-center justify-between opacity-60">
                  <div className="space-y-0.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#f4f4f2] font-display">Analytics Cookies</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3a3a3a] text-[#888] font-semibold">
                        None Active
                      </span>
                    </div>
                    <p className="text-xs text-[#9a9a94] font-serif">
                      Learning Partner does not use third-party analytics, tracking pixels, or advertising beacons.
                    </p>
                  </div>
                  <input type="checkbox" disabled checked={false} className="sr-only" />
                </div>
              </div>

              {/* Cookie Inventory & Deletion Action */}
              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-[#303030]">
                <p className="text-xs text-[#888] font-serif">
                  We maintain zero third-party tracking scripts. API keys for browser mode are kept in client-side IndexedDB only.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    withdrawConsent();
                    toast({
                      title: 'Non-Essential Cookies Deleted',
                      description: 'All preference cookies have been removed and consent has been reset to strictly necessary only.',
                    });
                  }}
                  className="text-xs w-full sm:w-auto shrink-0 text-amber-300 border-amber-500/30 hover:bg-amber-500/10 font-display justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete all non-essential cookies now
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Portability & Account Control */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Data Portability &amp; Account Control</CardTitle>
              <CardDescription>
                Export all your study notebooks and knowledge data, or permanently erase your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Data Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#262626] border border-[#303030]">
                <div>
                  <h4 className="font-display font-bold text-xs text-[#f4f4f2] flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    Export All My Data (JSON)
                  </h4>
                  <p className="text-xs text-[#9a9a94] font-serif mt-0.5 leading-relaxed">
                    Download a full JSON archive containing all notebooks, sources, notes, conversation chats, and generated studio outputs.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="text-xs w-full sm:w-auto shrink-0 font-display font-semibold justify-center"
                >
                  {isExporting ? 'Exporting...' : 'Export JSON Backup'}
                </Button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/15 border border-rose-500/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-display font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone: Permanent Account Deletion
                </div>
                <p className="text-xs font-serif text-[#dcdcd8] leading-relaxed">
                  Once deleted, your account and all data (notebooks, uploaded sources, chunks, notes, vector indexes, and generated outputs) will be wiped permanently from Neon Postgres. This action is irreversible.
                </p>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-xs w-full sm:w-auto font-display font-semibold justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete My Account and All Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button Row */}
      <div className="pt-6 pb-24 sm:pb-12 border-t border-[#303030] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          className="w-full sm:w-auto text-xs font-display font-semibold sm:min-w-[140px] justify-center h-11 sm:h-9 order-1 sm:order-2 shadow-lg shadow-brand-600/20"
        >
          {loading ? (
            'Saving...'
          ) : (
            <span className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              Save All Changes
            </span>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full sm:w-auto text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 justify-center h-10 sm:h-9 order-2 sm:order-1"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>

      {/* Typed Confirmation Deletion Dialog */}
      {deleteModalOpen && (
        <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
          <div className="p-4 sm:p-6 md:p-8 max-w-md w-full bg-[#1f1f1f] text-[#f4f4f2] rounded-2xl sm:rounded-3xl border border-rose-500/40 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-display font-bold text-base">Confirm Account Deletion</h3>
            </div>
            <p className="text-xs font-serif text-[#9a9a94] mb-4 leading-relaxed">
              This will permanently delete your user profile, notebooks, sources, and all cloud assets.
              To confirm, type <strong className="text-rose-400 font-mono">delete my account</strong> below:
            </p>

            <Input
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="delete my account"
              className="font-mono text-xs mb-6 border-rose-500/30 focus:border-rose-500"
              autoFocus
            />

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(false)} className="justify-center">
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'delete my account' || isDeletingAccount}
                className="text-xs font-display font-semibold justify-center"
              >
                {isDeletingAccount ? 'Deleting Everything...' : 'Permanently Delete Account'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* Connect AI Dialog */}
      <ConnectAiDialog
        open={manageKeysOpen}
        onOpenChange={setManageKeysOpen}
        onConnected={() => {
          loadUserConnections();
          router.refresh();
        }}
        onKeysUpdated={() => {
          loadUserConnections();
          router.refresh();
        }}
      />
    </form>
  );
}
