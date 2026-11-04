import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card, Badge, Button } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  Network,
  FileCheck,
  AlertTriangle,
  Mail,
  ArrowRight,
  RefreshCw,
  EyeOff,
  Server,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Security Overview — ${siteConfig.name}`,
  description:
    'Learn how Learning Partner protects your study data, isolates tenant databases, encrypts API keys at rest with AES-256-GCM, and defends against SSRF.',
  alternates: {
    canonical: `${siteConfig.url}/security`,
  },
};

export default async function SecurityPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="How We Protect Your Study Workspace"
      intro="A factual, transparent overview of the security engineering in Learning Partner. No marketing buzzwords, no inflated claims—just the real technical defenses implemented in this codebase."
      badge="Security Architecture"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Honest Disclosure Banner */}
        <div className="p-5 rounded-2xl bg-surface border border-border text-xs font-serif space-y-2">
          <div className="flex items-center gap-2 text-foreground font-display font-bold">
            <ShieldCheck className="w-4 h-4 text-brand-500 shrink-0" />
            Our Honest Security Commitment
          </div>
          <p className="text-muted-foreground leading-relaxed">
            No software system connected to the internet is 100% impenetrable. We do not make misleading claims of &ldquo;bank-grade&rdquo; or &ldquo;military-grade&rdquo; invulnerability, and we do not claim compliance certifications (such as SOC 2 or ISO 27001) that have not been audited by an accredited independent third party. Instead, we implement proven cryptographic standards, strict tenant isolation, and defensive engineering across every layer of the application.
          </p>
        </div>

        {/* 1. KEY ENCRYPTION AT REST */}
        <section className="space-y-4">
          <Badge variant="neutral">Credential Protection</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            1. AES-256-GCM Credential Encryption
          </h2>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            When you configure an API key for Google Gemini, OpenAI, Anthropic, or Groq:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-surface border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-display font-semibold text-foreground">
                <Lock className="w-3.5 h-3.5 text-brand-500" />
                Unique Per-Key Initialization Vectors
              </div>
              <p className="font-serif text-xs text-muted-foreground">
                Keys are encrypted using <strong>AES-256-GCM</strong> (Galois/Counter Mode). Each key is sealed with a cryptographically random 12-byte initialization vector (IV) and a 16-byte authentication tag to detect any tampering.
              </p>
            </Card>

            <Card className="p-4 bg-surface border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-display font-semibold text-foreground">
                <EyeOff className="w-3.5 h-3.5 text-brand-500" />
                Never Stored or Logged in Plaintext
              </div>
              <p className="font-serif text-xs text-muted-foreground">
                Plaintext keys are never stored in database tables, never written to console logs, and never returned to browser developer tools. Only masked fingerprints (e.g. <code>AIzaSy...4x9Q</code>) are displayed in the UI.
              </p>
            </Card>
          </div>
        </section>

        {/* 2. TENANT ISOLATION */}
        <section className="space-y-4">
          <Badge variant="neutral">Data Isolation</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            2. Strict Multi-Tenant Partitioning
          </h2>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your study notebooks and uploaded sources are stored in a dedicated Neon Postgres cluster. Every database query, source extraction, memory lookup, and vector similarity search enforces strict parameter binding on <code>user_id</code>. Users can never view, search, or query another user&apos;s sources.
          </p>
        </section>

        {/* 3. SSRF DEFENSE */}
        <section className="space-y-4">
          <Badge variant="neutral">Network Hardening</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            3. Server-Side Request Forgery (SSRF) Defenses
          </h2>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            When you add a public web article or configure a custom inference gateway:
          </p>
          <div className="p-4 rounded-xl bg-surface border border-border space-y-2 text-xs font-serif text-muted-foreground">
            <p>Our ingestion engine resolves the host DNS before establishing a network connection and strictly drops requests to:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li><strong>Loopback interfaces</strong> (<code>127.0.0.1</code>, <code>::1</code>, <code>localhost</code>)</li>
              <li><strong>Private network ranges</strong> (RFC 1918: <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code>, <code>192.168.0.0/16</code>)</li>
              <li><strong>Link-local &amp; Carrier-Grade NAT</strong> (<code>169.254.0.0/16</code>, <code>100.64.0.0/10</code>)</li>
              <li><strong>Cloud metadata services</strong> (e.g. AWS/GCP <code>169.254.169.254</code>)</li>
            </ul>
          </div>
        </section>

        {/* 4. UPLOAD VALIDATION */}
        <section className="space-y-4">
          <Badge variant="neutral">File Safety</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            4. Ingestion &amp; Image Upload Validation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">Document File Checks</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Document uploads are capped at 25MB, validated for permitted extensions (.pdf, .docx, .md, .txt), and processed through isolated parsing streams without executable shell execution.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
              <h4 className="font-display font-semibold text-xs sm:text-sm text-foreground">Image Magic Bytes &amp; EXIF Strip</h4>
              <p className="font-serif text-xs text-muted-foreground">
                Learning mode images are strictly checked by magic bytes (PNG, JPEG, WebP) and stripped of all EXIF metadata (including camera serial numbers and GPS coordinates) before storage.
              </p>
            </div>
          </div>
        </section>

        {/* 5. YOUR RESPONSIBILITIES */}
        <section className="space-y-4 border-t border-border/60 pt-10">
          <Badge variant="neutral">Shared Responsibility</Badge>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
            Your Responsibilities
          </h2>
          <div className="space-y-3 text-xs font-serif">
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-foreground text-xs sm:text-sm">Set Provider Spending Limits</h4>
              <p className="text-muted-foreground">
                Always set a hard monthly billing cap in your OpenAI or Anthropic developer accounts (e.g. $5.00/month). This guarantees you are protected from runaway billing in any situation.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-foreground text-xs sm:text-sm">Protect Your Account Credentials</h4>
              <p className="text-muted-foreground">
                Use strong passwords and enable 2-factor authentication on your primary email account used with Neon Auth or Google login.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-border space-y-1">
              <h4 className="font-display font-semibold text-foreground text-xs sm:text-sm">Disconnect Unused Connections</h4>
              <p className="text-muted-foreground">
                When you finish a research project, you can delete your connection in Settings. Deleting a connection immediately purges the encrypted key ciphertext from Postgres.
              </p>
            </div>
          </div>
        </section>

        {/* 6. VULNERABILITY DISCLOSURE */}
        <section className="p-6 rounded-2xl bg-surface border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-500" />
            <h3 className="font-display font-bold text-base text-foreground">
              Report a Vulnerability (Coordinated Disclosure)
            </h3>
          </div>
          <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
            If you believe you have discovered a security vulnerability in Learning Partner, please report it privately to our maintainer at:
          </p>
          <div className="font-mono text-xs text-brand-500 bg-surface-raised p-2.5 rounded-lg border border-border inline-block">
            {siteConfig.owner.contactEmail}
          </div>
          <p className="font-serif text-xs text-muted-foreground leading-relaxed">
            Please include steps to reproduce, affected endpoints, and proof-of-concept payloads. We commit to acknowledging reports within 24 hours and providing a remediation timeline before public disclosure.
          </p>
        </section>
      </div>
    </PageShell>
  );
}

