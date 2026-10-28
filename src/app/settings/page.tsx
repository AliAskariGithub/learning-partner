import { requireUser, getOrCreateProfile } from '@/lib/auth/session';
import { SettingsForm } from './SettingsForm';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const instant = false;

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);

  return (
    <div className="min-h-screen bg-[#191919] text-[#f4f4f2] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#303030] bg-[#1f1f1f]/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="flex items-center gap-2 text-xs text-[#9a9a94] hover:text-[#f4f4f2] transition font-display font-medium px-3 py-1.5 rounded-xl bg-[#262626] border border-[#303030] hover:border-brand-500/40"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-brand-400" />
            Back to Notebook
          </Link>
          <div className="h-4 w-px bg-[#303030]" />
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-[#f4f4f2]">User Profile &amp; Settings</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#f4f4f2]">
            User Profile &amp; Preferences
          </h1>
          <p className="mt-1 text-xs md:text-sm text-[#9a9a94] font-serif leading-relaxed">
            Update your personal identity, study language, Google Gemini API keys, and custom grounding instructions.
          </p>
        </div>

        <SettingsForm profile={profile} userEmail={user.email} />
      </main>
    </div>
  );
}
