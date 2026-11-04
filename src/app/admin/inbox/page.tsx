import React from 'react';
import type { Metadata } from 'next';
import { verifyAdminAuthorization, getAdminInboxData } from './actions';
import { InboxClient } from './InboxClient';
import { MarketingHeader } from '@/components/layout/MarketingHeader';

export const metadata: Metadata = {
  title: 'Admin Inbox — Internal Maintenance',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminInboxPage() {
  const adminUser = await verifyAdminAuthorization();
  const { messages, reports } = await getAdminInboxData();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <MarketingHeader isLoggedIn={true} />

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pulse" />
              <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
                Admin Maintenance Inbox
              </h1>
            </div>
            <p className="font-serif text-xs text-muted-foreground mt-0.5">
              Authorized session: <span className="font-mono text-foreground font-semibold">{adminUser.email}</span>
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Strict Multi-Tenant Isolation
          </div>
        </div>

        <InboxClient initialMessages={messages} initialReports={reports} />
      </main>
    </div>
  );
}

