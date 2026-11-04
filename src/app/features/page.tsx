import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { FeaturesClient } from './FeaturesClient';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `Features Tour — ${siteConfig.name}`,
  description:
    'Explore Learning Partner features: grounded citations, three study modes, image vision learning, studio synthesizers, voice overview, and shared notebook memory.',
  alternates: {
    canonical: `${siteConfig.url}/features`,
  },
};

export default async function FeaturesPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="Engineered for Rigorous Study"
      intro="Explore the full tour of Learning Partner: verifiable citation grounding, three specialized study modes, studio synthesizers, voice overviews, and shared notebook memory."
      badge="Feature Tour"
      isLoggedIn={isLoggedIn}
      maxWidth="2xl"
    >
      <FeaturesClient isLoggedIn={isLoggedIn} />
    </PageShell>
  );
}

