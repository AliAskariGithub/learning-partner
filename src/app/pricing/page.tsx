import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Button, Card, Badge } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  Check,
  Zap,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Pricing & Cost Guide — ${siteConfig.name}`,
  description:
    'Learning Partner charges $0 platform fees. Learn about our Bring Your Own AI cost model and direct provider pricing.',
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
};

export default async function PricingPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="Zero Platform Fees. Real Transparency."
      intro="Learning Partner does not charge software subscription fees. You bring your own AI keys or connect your existing subscriptions, paying provider wholesale rates directly."
      badge="Transparent BYOK Cost Model"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Core Software Cost Card */}
        <Card className="p-6 sm:p-8 bg-surface border-brand-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Badge variant="neutral" className="mb-2">Open-Source &amp; Free Access</Badge>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                Learning Partner Workspace
              </h2>
              <p className="font-serif text-xs sm:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                Full access to document upload, chunking, full-text search, vector embeddings, three study modes, shared notebook memory, and all seven studio synthesizers.
              </p>
            </div>
            <div className="text-left md:text-right shrink-0">
              <div className="font-display text-4xl sm:text-5xl font-extrabold text-foreground">
                $0
              </div>
              <div className="text-xs font-mono text-muted-foreground mt-1">
                Zero software markup
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-serif text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Unlimited study notebooks</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Up to 50 sources per notebook (25MB each)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>7 Studio Synthesizers + Voice Overview</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Complete self-service data export &amp; deletion</span>
            </div>
          </div>
        </Card>

        {/* What You Pay to AI Providers */}
        <section className="space-y-4">
          <Badge variant="neutral">Provider Wholesale Billing</Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            What You Pay to AI Providers
          </h2>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Because Learning Partner connects directly to your chosen AI accounts, any AI inference costs are billed directly by the provider. Here is a breakdown of the real cost models for each provider:
          </p>

          {/* Connection Comparison Table */}
          <div className="overflow-x-auto border border-border rounded-2xl bg-surface">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-surface-raised border-b border-border font-display font-semibold text-foreground">
                <tr>
                  <th className="p-3.5">Connection Option</th>
                  <th className="p-3.5">Estimated Cost</th>
                  <th className="p-3.5">Setup Effort</th>
                  <th className="p-3.5">Privacy Notice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-serif">
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    Google Gemini Free Tier
                  </td>
                  <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    $0.00
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Low (2 mins on AI Studio)
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    Google terms permit free-tier prompt data use for model improvement.
                  </td>
                </tr>
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    Google Gemini Paid Tier
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    ~$0.001 - $0.005 / hour of study
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Requires billing account
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    Strict enterprise non-training terms apply.
                  </td>
                </tr>
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    OpenAI API Key (GPT-4o mini)
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    ~$0.002 - $0.01 / session
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Low (prepaid balance)
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    OpenAI commercial API does not train on customer data.
                  </td>
                </tr>
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    Anthropic Claude Key
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    ~$0.01 - $0.05 / session
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Low (prepaid balance)
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    Anthropic does not train models on API inputs/outputs.
                  </td>
                </tr>
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    Groq Cloud
                  </td>
                  <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    Free Tier Available
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Low (1 min setup)
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    High speed LPU inference under Groq privacy terms.
                  </td>
                </tr>
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="p-3.5 font-display font-semibold text-foreground">
                    Self-Hosted (Ollama / vLLM)
                  </td>
                  <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-bold">
                    $0.00 (your hardware)
                  </td>
                  <td className="p-3.5 text-muted-foreground">
                    Advanced (local GPU setup)
                  </td>
                  <td className="p-3.5 text-xs text-muted-foreground">
                    100% private to your local machine or LAN.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Note on Rate Limits */}
        <div className="p-5 rounded-2xl bg-surface border border-border text-xs font-serif space-y-2">
          <div className="flex items-center gap-2 text-foreground font-display font-bold">
            <AlertCircle className="w-4 h-4 text-brand-500 shrink-0" />
            Where Do Usage Limits Come From?
          </div>
          <p className="text-muted-foreground leading-relaxed">
            All token quotas, requests-per-minute limits, and daily caps are enforced directly by the AI model providers (Google, OpenAI, Anthropic), not by Learning Partner. Setting a monthly spend limit (e.g. $5.00) in your OpenAI or Anthropic developer settings is recommended to keep costs predictable.
          </p>
        </div>

        {/* Call to Action */}
        <section className="text-center py-6 border-t border-border space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Start studying without software fees
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

