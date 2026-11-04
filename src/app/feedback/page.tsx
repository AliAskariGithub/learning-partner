import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { FeedbackClient } from './FeedbackClient';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `Feedback & Bug Reports — ${siteConfig.name}`,
  description:
    'Report bugs with screenshots, propose feature improvements, or share your study experience with the maintainer.',
  alternates: {
    canonical: `${siteConfig.url}/feedback`,
  },
};

interface FeedbackPageProps {
  searchParams: Promise<{ context?: string }>;
}

export default async function FeedbackPage({ searchParams }: FeedbackPageProps) {
  const session = await getSession();
  const isLoggedIn = !!session?.user;
  const { context } = await searchParams;

  return (
    <PageShell
      title="Report a Problem or Share Feedback"
      intro="Help us improve Learning Partner. Report defects with optional screenshots, suggest feature enhancements, or share what could be clearer."
      badge="User Feedback &amp; Bugs"
      isLoggedIn={isLoggedIn}
      maxWidth="lg"
    >
      <FeedbackClient
        initialContextUrl={context || ''}
        isLoggedIn={isLoggedIn}
      />
    </PageShell>
  );
}

