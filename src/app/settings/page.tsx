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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      {/* Top Bar */}
      <header className="h-14 sm:h-16 border-b border-border bg-surface/90 backdrop-blur px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          <Link
            href="/app"
            className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground hover:text-foreground transition font-display font-medium px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-raised border border-border hover:border-brand-500/40 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-brand-400" />
            <span className="hidden xs:inline">Back to Notebook</span>
            <span className="xs:hidden">Back</span>
          </Link>
          <div className="h-4 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-xs sm:text-sm text-foreground truncate">
              <span className="sm:hidden">Settings</span>
              <span className="hidden sm:inline">User Profile &amp; Settings</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl lg:max-w-6xl w-full mx-auto p-3.5 sm:p-6 md:p-10 pb-24 sm:pb-16">
        <div className="mb-5 sm:mb-8">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            User Profile &amp; Preferences
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-serif leading-relaxed">
            Update your personal identity, study language, Google Gemini API keys, and custom grounding instructions.
          </p>
        </div>

        <SettingsForm profile={profile} userEmail={user.email} />
      </main>
    </div>
  );
}
