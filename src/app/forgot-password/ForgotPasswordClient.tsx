'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { ArrowLeft, KeyRound, CheckCircle2, AlertCircle, RefreshCw, Eye, EyeOff, Sparkles, Lock } from 'lucide-react';

export function ForgotPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState(emailParam);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update email if query param changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0 || step !== 'reset') return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown, step]);

  // Focus first digit box when advancing to reset step
  useEffect(() => {
    if (step === 'reset') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // Step 1: Send recovery OTP code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send recovery code. Please check your email and try again.');
        setLoading(false);
        return;
      }

      setStep('reset');
      setResendCooldown(60);
      setInfoMessage('A 6-digit recovery code has been sent to your email.');
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || 'Network error while requesting code.');
      setLoading(false);
    }
  };

  // Step 2: Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const char = cleanVal.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = char;
    setDigits(nextDigits);

    if (index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle backspace/arrows
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Step 2: Handle paste of 6 digits
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
    otpInputRefs.current[focusIndex]?.focus();
  };

  // Step 2: Submit password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');

    if (code.length !== 6) {
      setError('Please enter the complete 6-digit recovery code.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please check your code and try again.');
        setLoading(false);
        return;
      }

      setStep('success');
      setLoading(false);

      // Smooth automatic redirect to /sign-in
      setTimeout(() => {
        router.push('/sign-in');
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'Network error while resetting password.');
      setLoading(false);
    }
  };

  // Step 2: Resend recovery OTP
  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;

    setResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
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

      setInfoMessage('A fresh 6-digit recovery code has been sent to your email.');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Network error while resending code.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    if (step === 'reset') {
      e.preventDefault();
      setStep('request');
      setError(null);
      setInfoMessage(null);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
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
          <span>{step === 'reset' ? 'Change email' : 'Back to sign in'}</span>
        </Link>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md py-8">
        <Card className="w-full shadow-2xl border-border bg-surface">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              {step === 'success' ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-400 animate-in zoom-in-75 duration-300" />
              ) : step === 'reset' ? (
                <Lock className="h-7 w-7" />
              ) : (
                <KeyRound className="h-7 w-7" />
              )}
            </div>

            <CardTitle className="text-2xl font-display font-bold">
              {step === 'success'
                ? 'Password Reset!'
                : step === 'reset'
                ? 'Create New Password'
                : 'Reset Password'}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto pt-1 leading-relaxed">
              {step === 'success' ? (
                'Your password has been successfully updated. Redirecting to sign in...'
              ) : step === 'reset' ? (
                <>
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-foreground font-mono">{email}</span> and your new password.
                </>
              ) : (
                'Enter your account email and we will send you a 6-digit code to recover your account.'
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
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

            {/* STEP 1: REQUEST CODE */}
            {step === 'request' && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="scholar@university.edu"
                    error={!!error}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  className="w-full h-11 text-sm rounded-xl font-display font-medium shadow-md shadow-brand-600/20 mt-2"
                >
                  Send Recovery Code
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Remember your password?{' '}
                    <Link
                      href="/sign-in"
                      className="font-display font-bold text-brand-400 hover:text-brand-300 transition"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            )}

            {/* STEP 2: ENTER CODE & SET NEW PASSWORD */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 text-center">
                    6-Digit Recovery Code
                  </label>
                  <div className="flex justify-between items-center gap-2 sm:gap-2.5 py-1" onPaste={handlePaste}>
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={loading}
                        className="w-12 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl bg-background border border-border text-foreground transition-all duration-150 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 outline-none select-none"
                        aria-label={`Digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={loading}
                  disabled={digits.some((d) => !d) || !newPassword || !confirmPassword || loading}
                  className="w-full h-11 text-sm rounded-xl font-display font-medium shadow-md shadow-brand-600/20 mt-2"
                >
                  Reset Password
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

                  <button
                    type="button"
                    onClick={() => {
                      setStep('request');
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-[11px] text-muted-foreground hover:text-foreground transition underline pt-1 cursor-pointer"
                  >
                    Change email address
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS STATE */}
            {step === 'success' && (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-xs text-muted-foreground font-display">
                  Your new credentials are live. Signing you in...
                </p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-display font-semibold transition shadow-md shadow-brand-600/20"
                >
                  Go to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

