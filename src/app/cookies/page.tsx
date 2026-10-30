import React from 'react';
import Link from 'next/link';
import {
  COOKIE_POLICY_VERSION,
  COOKIE_POLICY_UPDATED_AT,
  COOKIE_CATEGORIES,
  COOKIE_REGISTRY,
  CookieCategory,
} from '@/config/cookies';
import { Shield, Cookie, ArrowLeft, Database, CheckCircle2, Lock } from 'lucide-react';

export const metadata = {
  title: 'Cookie & Local Storage Policy — Learning Partner',
  description:
    'Comprehensive, transparent disclosure of every cookie and client storage key used by Learning Partner, generated from our central cookie registry.',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-[#141414] text-[#f4f4f2] selection:bg-brand-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-[#262626] bg-[#191919]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-display font-medium text-[#9a9a94] hover:text-[#f4f4f2] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#262626] border border-[#303030] text-[11px] font-mono text-[#9a9a94]">
            <Cookie className="w-3 h-3 text-brand-400" />
            <span>Policy v{COOKIE_POLICY_VERSION} · Updated {COOKIE_POLICY_UPDATED_AT}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Title & Intro */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-display font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy-First & Zero Tracking Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#f4f4f2] tracking-tight">
            Cookie & Local Storage Policy
          </h1>
          <p className="text-sm sm:text-base text-[#9a9a94] font-serif leading-relaxed max-w-2xl">
            Learning Partner believes in honest, consent-based technology. We do not use third-party tracking pixels, behavioural profiling, or commercial ad networks. This page discloses every cookie and browser storage technology we set, generated directly from our verified codebase registry.
          </p>
        </div>

        {/* Global Privacy Control (GPC) statement */}
        <div className="p-5 rounded-2xl bg-[#191919] border border-[#303030] space-y-2">
          <h2 className="text-sm font-display font-bold text-[#f4f4f2] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Global Privacy Control (GPC) Compliance</span>
          </h2>
          <p className="text-xs text-[#9a9a94] font-serif leading-relaxed">
            Our application respects your browser’s <code className="text-brand-300 font-mono">Sec-GPC</code> header and <code className="text-brand-300 font-mono">navigator.globalPrivacyControl</code> signal. If your browser or extension broadcasts this preference, non-essential cookies and local state are automatically disabled by default without needing manual interaction.
          </p>
        </div>

        {/* Dynamic Cookie Categories & Tables */}
        {(['strictly_necessary', 'preferences', 'analytics'] as CookieCategory[]).map((catId) => {
          const category = COOKIE_CATEGORIES[catId];
          const cookiesInCategory = COOKIE_REGISTRY.filter((c) => c.category === catId);

          return (
            <section key={catId} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#262626]">
                <div>
                  <h2 className="text-lg font-display font-bold text-[#f4f4f2] flex items-center gap-2">
                    {category.title}
                    {category.required ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#262626] border border-[#383838] text-[#9a9a94]">
                        Essential
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300">
                        Optional (Consent Required)
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-[#9a9a94] font-serif mt-1 max-w-2xl">
                    {category.description}
                  </p>
                </div>
                <span className="text-xs font-mono text-[#9a9a94]">
                  {cookiesInCategory.length} {cookiesInCategory.length === 1 ? 'cookie' : 'cookies'}
                </span>
              </div>

              {cookiesInCategory.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-[#2a2a2a] bg-[#191919]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#262626] bg-[#1f1f1f] text-[#9a9a94] font-mono">
                        <th className="p-3 font-semibold">Cookie Name</th>
                        <th className="p-3 font-semibold">Purpose & Data Retained</th>
                        <th className="p-3 font-semibold">Duration</th>
                        <th className="p-3 font-semibold">Security Attributes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#262626] text-[#b8b8b0]">
                      {cookiesInCategory.map((ck) => (
                        <tr key={ck.name} className="hover:bg-[#202020] transition-colors">
                          <td className="p-3 font-mono font-medium text-[#f4f4f2] whitespace-nowrap">
                            {ck.name}
                          </td>
                          <td className="p-3 font-serif max-w-md">
                            {ck.purpose}
                          </td>
                          <td className="p-3 font-mono text-[#9a9a94] whitespace-nowrap">
                            {ck.duration}
                          </td>
                          <td className="p-3 font-mono text-[10px] space-x-1 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-[#262626] text-[#9a9a94]">
                              {ck.sameSite.toUpperCase()}
                            </span>
                            {ck.httpOnly && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                                HttpOnly
                              </span>
                            )}
                            {ck.secure && (
                              <span className="px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-300">
                                Secure
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#191919] border border-[#262626] text-xs text-[#9a9a94] font-serif italic">
                  No cookies are currently assigned to this category.
                </div>
              )}
            </section>
          );
        })}

        {/* IndexedDB Disclosure for Browser Mode (Requirement 7) */}
        <section className="p-6 rounded-2xl bg-[#191919] border border-[#303030] space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-display font-bold text-[#f4f4f2]">
              Client-Side Browser Storage (IndexedDB)
            </h2>
          </div>
          <p className="text-xs text-[#9a9a94] font-serif leading-relaxed">
            When you explicitly connect a local AI model via <strong>Browser Mode</strong> (e.g. self-hosted OmniRoute, Ollama, or LM Studio running on <code className="text-brand-300 font-mono">http://localhost:20128/v1</code>), your endpoint authentication key is stored strictly within your browser’s isolated <code className="text-brand-300 font-mono">IndexedDB (learningpartner_local_keys)</code>. It is used exclusively by your local browser runtime to stream responses directly from your machine and is <strong>never transmitted to or stored on our servers</strong>.
          </p>
        </section>

        {/* How to manage and withdraw */}
        <section className="space-y-3">
          <h2 className="text-sm font-display font-bold text-[#f4f4f2] flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Withdrawing Consent and Managing Cookies</span>
          </h2>
          <p className="text-xs text-[#9a9a94] font-serif leading-relaxed">
            You can change your consent choices at any time by clicking the <strong>Cookie Settings</strong> link in the footer of any page or navigating to <strong>Settings → Privacy &amp; Cookies</strong> inside the application. When you withdraw consent or choose to reject non-essential cookies, all preference cookies are immediately purged from your browser.
          </p>
        </section>
      </main>
    </div>
  );
}
