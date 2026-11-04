import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { FaqClient } from './FaqClient';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `Frequently Asked Questions — ${siteConfig.name}`,
  description:
    'Search our frequently asked questions on verifiable citations, supported formats, three study modes, voice overview, BYOK keys, and security.',
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
};

export default async function FaqPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="Frequently Asked Questions"
      intro="Everything you need to know about citation grounding, source chunking, three study modes, studio synthesizers, BYOK encryption, and data privacy."
      badge="Knowledge Base"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <FaqClient />
    </PageShell>
  );
}

