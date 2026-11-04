import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { MarkdownRenderer } from '@/components/content/MarkdownRenderer';
import { getLegalDoc, extractHeadings } from '@/lib/content';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `Terms of Service — ${siteConfig.name}`,
  description:
    'Review the terms of service governing your access to and use of the Learning Partner study platform.',
  alternates: {
    canonical: `${siteConfig.url}/terms`,
  },
};

export default async function TermsPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  const doc = getLegalDoc('terms');
  const toc = extractHeadings(doc.content);

  return (
    <PageShell
      title={doc.frontmatter.title}
      intro={doc.frontmatter.summary}
      badge="Legal & Terms"
      toc={toc}
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-muted-foreground pb-4 border-b border-border/60">
          <span>Last Updated: {doc.frontmatter.lastUpdated}</span>
          <span>Effective: {doc.frontmatter.effectiveDate}</span>
        </div>

        <MarkdownRenderer content={doc.content} />
      </div>
    </PageShell>
  );
}
