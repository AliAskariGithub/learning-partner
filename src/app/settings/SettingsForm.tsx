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
} from 'lucide-react';
import { ManageApiKeysDialog } from '@/components/ai/ManageApiKeysDialog';
import { getUserApiKeys, SafeApiKey } from '@/app/app/api-key-actions';

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

  // BYOK API Keys State
  const [manageKeysOpen, setManageKeysOpen] = useState(false);
  const [userApiKeysList, setUserApiKeysList] = useState<SafeApiKey[]>([]);

  // Data Export & Deletion State
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadUserKeys();
    const savedVoicePref = localStorage.getItem('lp_voice_provider') as any;
    if (savedVoicePref) setVoiceProviderPreference(savedVoicePref);
  }, []);

  const loadUserKeys = async () => {
    try {
      const keys = await getUserApiKeys();
      setUserApiKeysList(keys);
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
      variant: 'brand',
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
            variant: 'brand',
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
          variant: 'brand',
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
          variant: 'brand',
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
        await authClient.signOut().catch(() => {});
        window.location.href = '/';
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
        <TabsList className="grid grid-cols-5 w-full bg-[#262626] border border-[#303030] p-1 rounded-2xl mb-6">
          <TabsTrigger value="profile" className="text-xs font-display flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="instructions" className="text-xs font-display flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Custom Instructions</span>
          </TabsTrigger>
          <TabsTrigger value="apikeys" className="text-xs font-display flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs font-display flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="text-xs font-display flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
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
              <div className="flex items-center gap-4 pb-4 border-b border-[#303030]">
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

                <div>
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
                          variant: 'brand',
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

        {/* TAB 3: API KEYS & VOICE PROVIDER */}
        <TabsContent value="apikeys">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Provider Keys &amp; Voice Provider</CardTitle>
                  <CardDescription>
                    Bring Your Own Key (BYOK) with AES-256-GCM zero-retention encryption.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setManageKeysOpen(true)}
                  className="text-xs"
                >
                  <Key className="w-3.5 h-3.5 mr-1.5" />
                  Manage Keys
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

              {/* Active User Keys Summary */}
              <div>
                <p className="text-xs font-display font-semibold uppercase tracking-wider text-[#9a9a94] mb-2">
                  Configured Keys ({userApiKeysList.length})
                </p>
                {userApiKeysList.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#191919] border border-dashed border-[#303030]">
                    <Key className="w-6 h-6 text-[#9a9a94] mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-display text-[#f4f4f2]">No personal API keys added yet</p>
                    <p className="text-[11px] text-[#9a9a94] font-serif mt-1">
                      Click &quot;Manage Keys&quot; to connect Google Gemini, OpenAI, Claude, Groq, or OpenRouter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userApiKeysList.map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-[#191919] border border-[#303030] text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold capitalize text-[#f4f4f2]">{k.provider}</span>
                          <span className="font-mono text-[11px] text-[#9a9a94]">{k.label}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#262626] text-[#9a9a94]">
                            •••• {k.keyLast4}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                    ))}
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
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Moon className="w-6 h-6 mx-auto mb-2 text-brand-400" />
                  <p className="font-display font-bold text-xs">Dark Mode</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Warm Claude Charcoal</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Sun className="w-6 h-6 mx-auto mb-2 text-amber-400" />
                  <p className="font-display font-bold text-xs">Light Mode</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Clean Crisp Ivory</p>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'system'
                      ? 'bg-brand-950/30 border-brand-500 text-white shadow-md'
                      : 'bg-[#262626] border-[#303030] text-[#9a9a94] hover:text-[#f4f4f2]'
                  }`}
                >
                  <Laptop className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
                  <p className="font-display font-bold text-xs">System Match</p>
                  <p className="text-[10px] mt-0.5 opacity-80">Sync with OS Theme</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: DATA & PRIVACY */}
        <TabsContent value="data">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Data Portability &amp; Account Control</CardTitle>
              <CardDescription>
                Export all your study notebooks and knowledge data, or permanently erase your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Export Data Card */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#262626] border border-[#303030]">
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
                  className="text-xs shrink-0 font-display font-semibold"
                >
                  {isExporting ? 'Exporting...' : 'Export JSON Backup'}
                </Button>
              </div>

              {/* Danger Zone: Delete Account */}
              <div className="p-4 rounded-2xl bg-rose-950/15 border border-rose-500/30 space-y-3">
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
                  className="text-xs font-display font-semibold"
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
      <div className="flex items-center justify-between pt-4 border-t border-[#303030]">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          disabled={signingOut}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          {signingOut ? 'Signing out...' : 'Sign Out'}
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading}
          className="text-xs font-display font-semibold min-w-[130px]"
        >
          {loading ? (
            'Saving...'
          ) : (
            <span className="flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" />
              Save All Changes
            </span>
          )}
        </Button>
      </div>

      {/* Typed Confirmation Deletion Dialog */}
      {deleteModalOpen && (
        <Dialog open={deleteModalOpen} onOpenChange={() => setDeleteModalOpen(false)}>
          <div className="p-6 md:p-8 max-w-md w-full bg-[#1f1f1f] text-[#f4f4f2] rounded-3xl border border-rose-500/40 shadow-2xl">
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

            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmationText !== 'delete my account' || isDeletingAccount}
                className="text-xs font-display font-semibold"
              >
                {isDeletingAccount ? 'Deleting Everything...' : 'Permanently Delete Account'}
              </Button>
            </div>
          </div>
        </Dialog>
      )}

      {/* BYOK API Keys Dialog */}
      <ManageApiKeysDialog
        open={manageKeysOpen}
        onOpenChange={setManageKeysOpen}
        onKeysUpdated={() => {
          loadUserKeys();
          router.refresh();
        }}
      />
    </form>
  );
}
