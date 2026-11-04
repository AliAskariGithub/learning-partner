import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { ContactClient } from './ContactClient';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: `Contact Us — ${siteConfig.name}`,
  description:
    'Have a question or feedback? Send a message directly to the Learning Partner team.',
  alternates: {
    canonical: `${siteConfig.url}/contact`,
  },
};

export default async function ContactPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;
  const initialName = session?.user?.name || '';
  const initialEmail = session?.user?.email || '';

  return (
    <PageShell
      title="Get in Touch"
      intro="Have a question about document grounding, found an issue, or want to contribute to the open-source project? We read every message."
      badge="Contact Support"
      isLoggedIn={isLoggedIn}
      maxWidth="lg"
    >
      <ContactClient
        initialName={initialName}
        initialEmail={initialEmail}
        isLoggedIn={isLoggedIn}
      />
    </PageShell>
  );
}

