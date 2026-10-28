import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function TermsPage() {
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
        <span className="font-display font-bold text-sm">Terms of Service</span>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-xs text-muted-foreground font-mono mb-8">Last Updated: October 2026</p>

        <div className="prose prose-invert prose-brand max-w-none text-sm font-serif leading-relaxed space-y-4 text-muted-foreground">
          <p>
            Welcome to Learning Partner. By accessing or using our application, you agree to be bound by these Terms of Service.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">1. Bring Your Own Key (BYOK) Usage</h3>
          <p>
            Learning Partner operates on a Bring Your Own Key model. You are solely responsible for maintaining the confidentiality of your third-party API credentials (Google, OpenAI, Anthropic, Groq). All usage costs incurred via your keys remain your responsibility.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">2. Content &amp; Intellectual Property</h3>
          <p>
            You retain all rights, title, and interest in and to any study materials, research documents, lecture slides, and notes uploaded to the platform. Learning Partner does not claim ownership or train foundational AI models on your private documents.
          </p>
          <h3 className="text-foreground font-display font-bold text-base mt-6">3. Acceptable Use</h3>
          <p>
            You agree not to misuse the service, upload malicious files, attempt server-side request forgery (SSRF) or penetrate network security boundaries.
          </p>
        </div>
      </main>
    </div>
  );
}

