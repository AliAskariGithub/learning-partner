'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

export function VerifyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Update email if query param changes or fetch from session
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    } else {
      authClient.getSession().then((session: any) => {
        if (session?.data?.user?.email) {
          setEmail(session.data.user.email);
        }
      }).catch(() => {});
    }
  }, [emailParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    setInfoMessage(null);

    // Only allow numbers
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    // Single digit input
    const char = cleanVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    // Auto-advance focus
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all 6 digits are filled, automatically verify!
    if (nextDigits.every((d) => d.length === 1)) {
      triggerVerification(nextDigits.join(''));
    }
  };

  // Handle keyboard navigation (Backspace, arrows)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste of 6 digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pastedData[i] || '';
    }
    setDigits(nextDigits);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pastedData.length === 6) {
      triggerVerification(pastedData);
    }
  };

  // Trigger verification
  const triggerVerification = async (codeToVerify: string) => {
    if (!email) {
      setError('Email address is missing. Please return to sign in.');
      return;
    }

    if (codeToVerify.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: codeToVerify,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed. Please check the code and try again.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Smooth automatic redirect to /app
      setTimeout(() => {
        router.push('/app');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || 'Failed to verify code. Please check your network connection.');
      setLoading(false);
    }
  };

  // Resend OTP code
  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/send-verification-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to resend code. Please try again.');
        setResending(false);
        return;
      }

      setInfoMessage('A fresh 6-digit verification code has been sent to your email.');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Network error while resending code.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-4 sm:p-6">
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/sign-in"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-medium text-muted-foreground hover:text-foreground bg-surface/80 hover:bg-surface border border-border hover:border-brand-500/40 shadow-sm transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Verification Card */}
      <div className="w-full max-w-md py-8">
        <Card className="w-full shadow-2xl border-border bg-surface">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              {success ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-in zoom-in-75 duration-300" />
              ) : (
                <Mail className="h-7 w-7" />
              )}
            </div>

            <CardTitle className="text-2xl font-display font-bold">
              {success ? 'Account Verified!' : 'Check Your Email'}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto pt-1 leading-relaxed">
              {success ? (
                'Your email has been confirmed. Redirecting to your workspace...'
              ) : (
                <>
                  We sent a 6-digit confirmation code to{' '}
                  <span className="font-semibold text-foreground font-mono">{email || 'your email'}</span>.
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-error-soft border border-error/30 text-error-text text-xs font-display">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-display">
                <Sparkles className="h-4 w-4 shrink-0 text-brand-400" />
                <span>{infoMessage}</span>
              </div>
            )}

            {!success && (
              <>
                {/* 6 Discrete Digit Boxes */}
                <div className="flex justify-between items-center gap-2 sm:gap-2.5 py-2" onPaste={handlePaste}>
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={loading || success}
                      className="w-12 h-14 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-background border border-border text-foreground transition-all duration-150 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 outline-none select-none disabled:opacity-50"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Submit Button */}
                <Button
                  type="button"
                  variant="primary"
                  isLoading={loading}
                  disabled={digits.some((d) => !d) || loading}
                  onClick={() => triggerVerification(digits.join(''))}
                  className="w-full h-11 text-sm rounded-xl font-display font-medium shadow-md shadow-brand-600/20"
                >
                  Verify Code
                </Button>

                {/* Resend Section */}
                <div className="flex flex-col items-center justify-center pt-2 space-y-2 text-xs">
                  {resendCooldown > 0 ? (
                    <p className="text-muted-foreground font-mono">
                      Resend code in <span className="font-semibold text-foreground">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      disabled={resending}
                      onClick={handleResend}
                      className="inline-flex items-center gap-1.5 font-display font-semibold text-brand-400 hover:text-brand-300 transition cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Sending new code...' : 'Resend code'}</span>
                    </button>
                  )}

                  <p className="text-[11px] text-muted-foreground pt-1">
                    Wrong email?{' '}
                    <Link href="/sign-up" className="font-medium text-foreground hover:underline">
                      Sign up with another email
                    </Link>
                  </p>
                </div>
              </>
            )}

            {success && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="inline-block w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground font-display">Entering your workspace...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
