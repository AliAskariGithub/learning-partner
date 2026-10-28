'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBack = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      router.push('/app');
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'An unexpected authentication error occurred.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/app`,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google sign in.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-4 sm:p-6">
      {/* Back Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <Link
          href="/"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-display font-medium text-muted-foreground hover:text-foreground bg-surface/80 hover:bg-surface border border-border hover:border-brand-500/40 shadow-sm transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-brand-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </Link>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md py-8">
        <Card className="w-full shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your source notebooks and study tools
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-error-soft border border-error/30 text-error-text text-xs font-display">
                <AlertCircle className="h-4 w-4 shrink-0 text-error" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 h-11 text-sm rounded-xl"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-display font-semibold">
                <span className="bg-surface px-2 text-muted-foreground">Or with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Email
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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-display font-semibold text-brand-400 hover:text-brand-300 transition"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  error={!!error}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={loading}
                className="w-full h-11 text-sm rounded-xl mt-2"
              >
                Sign In
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account yet?{' '}
                <Link
                  href="/sign-up"
                  className="font-display font-bold text-brand-400 hover:text-brand-300 transition"
                >
                  Create one free
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
