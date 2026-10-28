import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <header className="h-16 border-b border-border bg-surface/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition font-display font-medium px-3 py-1.5 rounded-xl bg-surface-raised border border-border"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-brand-400" />
          Back to Home
        </Link>
        <span className="font-display font-bold text-sm">Privacy Policy</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-xs text-muted-foreground font-mono mb-8">Last Updated: October 2026</p>

        <div className="prose prose-invert prose-brand max-w-none text-sm font-serif leading-relaxed space-y-4 text-muted-foreground">
          <p>
            Your privacy is foundational to Learning Partner. This Privacy Policy describes how your information is handled.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">1. Key &amp; Credential Encryption</h3>
          <p>
            All user-supplied API keys are encrypted at rest using AES-256-GCM. We never log, store, or transmit your decrypted keys to any third party other than the designated provider endpoint when you initiate a request.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">2. Database Isolation</h3>
          <p>
            Your data is stored securely in Neon Postgres. All queries, chunks, notes, and generated study artifacts are isolated per authenticated user account with strict row-level authorization.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">3. Data Portability and Deletion</h3>
          <p>
            You have full ownership of your data. You may download a complete JSON export of all notebooks and study outputs at any time, or permanently delete your account and all associated cloud assets in Settings.
          </p>
        </div>
      </main>
    </div>
  );
}

