import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card, Badge, Button } from '@/components/ui';
import { HelpSearch } from '@/components/help/HelpSearch';
import { getAllHelpArticles } from '@/lib/content';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  BookOpen,
  ArrowRight,
  FileText,
  Sparkles,
  Key,
  ShieldCheck,
  BrainCircuit,
  HelpCircle,
  Bug,
  Mail,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Help Center & Documentation — ${siteConfig.name}`,
  description:
    'Comprehensive documentation, step-by-step guides, troubleshooting, and source ingestion instructions for Learning Partner.',
  alternates: {
    canonical: `${siteConfig.url}/help`,
  },
};

export default async function HelpCenterPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  const articles = getAllHelpArticles();

  const searchItems = articles.map((a) => ({
    slug: a.slug,
    title: a.frontmatter.title,
    summary: a.frontmatter.summary,
    category: a.frontmatter.category,
  }));

  return (
    <PageShell
      title="Help Center &amp; Documentation"
      intro="Guides, tutorials, troubleshooting, and architectural references for getting the most out of your grounded study partner."
      badge="User Manual &amp; Docs"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Search Bar */}
        <div className="py-2">
          <HelpSearch articles={searchItems} />
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {articles.map((art) => (
            <Link
              key={art.slug}
              href={`/help/${art.slug}`}
              className="block group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-2xl"
            >
              <Card className="p-5 sm:p-6 bg-surface border-border group-hover:border-brand-500/60 transition-all h-full flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-brand-500 uppercase font-semibold">
                      {art.frontmatter.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-foreground group-hover:text-brand-400 transition-colors">
                    {art.frontmatter.title}
                  </h3>
                  <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {art.frontmatter.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 text-[11px] font-mono text-muted-foreground">
                  Updated: {art.frontmatter.lastUpdated}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Support & Feedback Banner */}
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-display font-bold text-lg text-foreground">
              Can&apos;t find what you need?
            </h3>
            <p className="font-serif text-xs sm:text-sm text-muted-foreground">
              Our maintainers are here to help. Reach out directly or report a technical defect.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact">
              <Button variant="secondary" size="sm">
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                Contact Support
              </Button>
            </Link>
            <Link href="/feedback">
              <Button variant="primary" size="sm">
                <Bug className="w-3.5 h-3.5 mr-1.5" />
                Report a Bug
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

