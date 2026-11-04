import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Button, Card, Badge } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  Key,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Zap,
  HelpCircle,
  AlertTriangle,
  Server,
  Globe,
  ArrowRight,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Connect Your AI Guide — ${siteConfig.name}`,
  description:
    'Step-by-step setup guide for connecting Google Gemini Free Tier, ChatGPT Plus/Pro, Anthropic Claude, OpenAI, Groq, and custom endpoints.',
  alternates: {
    canonical: `${siteConfig.url}/connect-ai`,
  },
};

export default async function ConnectAiPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  const chatGptEnabled = siteConfig.features.chatGptEnabled;

  return (
    <PageShell
      title="Connect Your AI Provider (BYOK)"
      intro="Learning Partner operates on Bring Your Own AI. Choose your model, retain your privacy agreements, and pay provider wholesale rates directly—or study for free on Google Gemini."
      badge="Setup Guide"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Important Consumer Subscription Notice */}
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-serif space-y-2">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-display font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Important Note on Consumer Subscriptions
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Consumer web subscriptions (such as <strong>Claude Pro</strong> or <strong>Gemini Advanced</strong> web memberships) do not provide API keys for third-party applications. To connect Claude or Gemini to external software, you must obtain an API key through their official developer platforms (Google AI Studio or Anthropic Console).
          </p>
        </div>

        {/* 1. GOOGLE GEMINI KEY (RECOMMENDED) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center font-display font-bold text-xs">1</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Google Gemini Key (Recommended)
              </h2>
            </div>
            <Badge variant="neutral">Best for Students • Free Tier Available</Badge>
          </div>

          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Google provides a generous developer free tier for Gemini models (including Gemini 3.8 Flash and 2.5 Flash), providing fast responses and long context windows suitable for entire textbooks.
          </p>

          <Card className="p-5 bg-surface border-border space-y-4">
            <h4 className="font-display font-semibold text-sm text-foreground">Step-by-Step Instructions:</h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs font-serif text-muted-foreground">
              <li>
                Open the official <strong>Google AI Studio</strong> dashboard:{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline inline-flex items-center gap-0.5"
                >
                  aistudio.google.com/apikey <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>Sign in with your Google Account.</li>
              <li>Click <strong>Create API Key</strong> and copy your key (starts with <code>AIzaSy...</code>).</li>
              <li>In Learning Partner, open the model selector in the chat bar and select <strong>Google Gemini</strong>.</li>
              <li>Paste your key and click <strong>Save &amp; Connect</strong>.</li>
            </ol>

            <div className="p-3.5 rounded-xl bg-surface-raised border border-border/80 space-y-2 text-xs font-serif">
              <div className="font-display font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Free-Tier Limits &amp; Privacy Notice:
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong>Quota Limits:</strong> Google typically limits free-tier accounts to 15 requests per minute (RPM) and 1,500 requests per day (RPD). If you hit a 429 quota error, wait 60 seconds or switch models.
              </p>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                <strong>Privacy Policy:</strong> Under Google&apos;s published developer terms, prompt content sent over the Free Tier may be reviewed by human annotators to improve Google products. If you require complete enterprise privacy, Google requires enabling a paid billing account on Google AI Studio.
              </p>
            </div>
          </Card>
        </section>

        {/* 2. CHATGPT PLAN CONNECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-display font-bold text-xs">2</span>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                Connect with ChatGPT
              </h2>
            </div>
            {chatGptEnabled ? (
              <Badge variant="neutral">Plus or Pro Required</Badge>
            ) : (
              <Badge variant="neutral" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                Coming Soon
              </Badge>
            )}
          </div>

          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Allows users with an active ChatGPT Plus or Pro subscription to authorize requests directly using OAuth 2.0 with PKCE without needing an OpenAI developer credit card.
          </p>

          <Card className="p-5 bg-surface border-border space-y-3">
            {chatGptEnabled ? (
              <div className="space-y-2 text-xs font-serif text-muted-foreground">
                <p>1. Open the model selector and click <strong>Connect with ChatGPT</strong>.</p>
                <p>2. You will be redirected to OpenAI’s secure OAuth authorization screen.</p>
                <p>3. Review permissions and approve access. You are redirected back with a secure PKCE token.</p>
              </div>
            ) : (
              <div className="space-y-2 text-xs font-serif text-muted-foreground">
                <p className="italic">
                  This integration is currently behind a feature flag while OAuth provider agreements are finalized. Once enabled, you will be able to sign in with your OpenAI account and use your existing Plus/Pro allowance directly.
                </p>
                <p>In the meantime, you can connect an OpenAI API key below.</p>
              </div>
            )}
          </Card>
        </section>

        {/* 3. OTHER PLATFORMS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-display font-bold text-xs">3</span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Other AI Platforms (API Keys &amp; Endpoints)
            </h2>
          </div>

          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Connect developer accounts from major model providers. You pay providers directly for the tokens you consume:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-sm text-foreground">OpenAI API Key</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Create an API key at{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline inline-flex items-center gap-0.5"
                >
                  platform.openai.com/api-keys <ExternalLink className="w-3 h-3" />
                </a>. Supports GPT-4o, GPT-4o-mini, and OpenAI TTS voice synthesis. Commercial API data is never used to train models.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-sm text-foreground">Anthropic Claude Key</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Create an API key at{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline inline-flex items-center gap-0.5"
                >
                  console.anthropic.com <ExternalLink className="w-3 h-3" />
                </a>. Known for nuanced analytical reasoning and 200k token context windows.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-sm text-foreground">Groq Cloud</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Create a free key at{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline inline-flex items-center gap-0.5"
                >
                  console.groq.com <ExternalLink className="w-3 h-3" />
                </a>. Delivers ultra-low latency inference on open models like Llama 3 and Mixtral.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-sm text-foreground">OpenRouter</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Obtain a key at{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline inline-flex items-center gap-0.5"
                >
                  openrouter.ai <ExternalLink className="w-3 h-3" />
                </a>. Access hundreds of open-source and proprietary models through a single balance.
              </p>
            </div>
          </div>

          {/* Server Mode vs Browser Mode */}
          <Card className="p-5 bg-surface border-border space-y-3 mt-4">
            <h4 className="font-display font-semibold text-sm text-foreground flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-500" />
              Custom Endpoints: Server Mode vs. Browser Mode
            </h4>
            <p className="font-serif text-xs text-muted-foreground leading-relaxed">
              When configuring custom endpoints (such as local Ollama, vLLM, or LocalAI servers), Learning Partner provides two connection modes:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-surface-raised border border-border/70 text-xs font-serif">
                <span className="font-display font-bold text-foreground block mb-1">Server Mode</span>
                <span className="text-muted-foreground">
                  Requests are proxied through our backend with strict SSRF defense (blocking intranet and cloud metadata IP ranges). Required when your model requires an encrypted API key header.
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-raised border border-border/70 text-xs font-serif">
                <span className="font-display font-bold text-foreground block mb-1">Browser Mode</span>
                <span className="text-muted-foreground">
                  Requests are dispatched directly from your browser to your local host (e.g. <code>localhost:11434</code>). Perfect for entirely offline or LAN inference without sending traffic over the internet.
                </span>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. TROUBLESHOOTING COMMON CONNECTION ISSUES */}
        <section className="space-y-4 border-t border-border/60 pt-10">
          <Badge variant="neutral">Troubleshooting</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            Resolving Connection Issues
          </h2>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">
                Error 401: Unauthorized / Invalid Key
              </h4>
              <p className="font-serif text-xs text-muted-foreground">
                Check that your API key was copied completely without trailing whitespace. If you revoked or regenerated the key on your provider console, re-enter it in Learning Partner.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">
                Error 429: Rate Limit or Quota Exceeded
              </h4>
              <p className="font-serif text-xs text-muted-foreground">
                Free-tier keys have strict requests-per-minute caps. Wait 60 seconds before resending, switch to another model, or configure provider billing to increase your threshold.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">
                Feature Disabled: Model Does Not Support Capability
              </h4>
              <p className="font-serif text-xs text-muted-foreground">
                Certain features require specific model architectures (e.g., image uploads in Learning Mode require vision support; structured quizzes require JSON schema support). Switch to a model supporting the feature.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center py-6 border-t border-border space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Ready to configure your study partner?
          </h2>
          <div className="flex items-center justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/app">
                <Button variant="primary" size="lg">
                  Open Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button variant="primary" size="lg">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

