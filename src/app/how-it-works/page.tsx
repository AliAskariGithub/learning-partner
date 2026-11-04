import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { HowItWorksClient } from './HowItWorksClient';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `How It Works — ${siteConfig.name}`,
  description:
    'Discover how Learning Partner splits sources into passages, retrieves relevant chunks, and grounds every answer with citations without hallucinations.',
  alternates: {
    canonical: `${siteConfig.url}/how-it-works`,
  },
};

export default async function HowItWorksPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="How Grounding Actually Works"
      intro="From raw PDF files to verified answers: a transparent three-step walkthrough of how Learning Partner indexes, retrieves, and synthesizes knowledge from your sources."
      badge="Under the Hood"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <HowItWorksClient isLoggedIn={isLoggedIn} />
    </PageShell>
  );
}

