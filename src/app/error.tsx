'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw, Home, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  const isCookieOrSessionError =
    error?.message?.toLowerCase().includes('cookie') ||
    error?.message?.toLowerCase().includes('session') ||
    error?.message?.toLowerCase().includes('server action');

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Subtle ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-red-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-error-soft border border-error/30 flex items-center justify-center mx-auto mb-4 text-error shadow-inner">
          <AlertCircle className="h-7 w-7" />
        </div>

        {/* Title and Subtitle */}
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground font-serif leading-relaxed">
          An error occurred while loading this view or syncing your data. Your notebooks and study notes remain safe.
        </p>

        {/* Smart contextual session banner */}
        {isCookieOrSessionError && (
          <div className="mt-4 p-3 rounded-xl bg-brand-950/40 border border-brand-700/50 text-xs text-brand-300 text-left w-full">
            <span className="font-semibold block mb-0.5">Session Refresh</span>
            Your session token was updated. Click &ldquo;Try Again&rdquo; or return to the workspace to resume seamlessly.
          </div>
        )}

        {/* Collapsible Technical Details */}
        {error.message && (
          <div className="mt-4 w-full text-left">
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors mx-auto"
            >
              <span>{showDetails ? 'Hide error details' : 'View error details'}</span>
              {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showDetails && (
              <div className="mt-2 p-3 rounded-xl bg-surface-raised border border-border text-[11px] text-error font-mono overflow-x-auto max-h-36">
                {error.message}
                {error.digest && (
                  <div className="mt-1 text-[10px] text-muted-foreground">Digest: {error.digest}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:flex-1 justify-center"
            onClick={() => reset()}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Try Again
          </Button>

          <Link href="/app" className="w-full sm:flex-1">
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
            >
              <Home className="h-4 w-4 mr-1.5" />
              Workspace
            </Button>
          </Link>
        </div>

        {/* Hard reload fallback */}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Reload entire page
        </button>
      </div>
    </div>
  );
}
