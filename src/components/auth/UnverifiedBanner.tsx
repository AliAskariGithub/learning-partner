'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, X, Loader2 } from 'lucide-react';

interface UnverifiedBannerProps {
  email: string;
  isVerified?: boolean;
}

export function UnverifiedBanner({ email, isVerified = false }: UnverifiedBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // If already verified or user dismissed for this view, do not display
  if (isVerified || dismissed || !email) {
    return null;
  }

  const handleVerifyNow = async () => {
    setSending(true);
    try {
      // Trigger a fresh 6-digit OTP code to their email
      await fetch('/api/auth/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch (err) {
      console.warn('Could not auto-trigger OTP on banner click:', err);
    } finally {
      // Smooth automatic redirect to verify page
      router.push(`/verify?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    }
  };

  return (
    <aside
      aria-label="Account verification notice"
      className="relative z-50 w-full bg-gradient-to-r from-red-950 via-[#2a0d0d] to-red-950 border-b border-red-500/40 px-4 py-2 text-xs text-red-200 shadow-md flex items-center justify-between gap-3 shrink-0"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="relative flex items-center justify-center shrink-0 w-4 h-4">
          <span className="absolute w-3 h-3 rounded-full bg-red-500/50 animate-ping" />
          <AlertTriangle className="relative w-4 h-4 text-red-400" />
        </div>
        <p className="truncate font-sans font-medium">
          <span className="font-semibold text-red-100">Account Not Verified:</span>{' '}
          Please verify your email address (<span className="font-mono text-red-200">{email}</span>) to ensure full access.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleVerifyNow}
          disabled={sending}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-display font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {sending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Sending code...</span>
            </>
          ) : (
            <>
              <span>Verify Now</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-red-400/80 hover:text-red-200 rounded hover:bg-red-900/40 transition-colors"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}

