'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-error-soft border border-error/30 flex items-center justify-center mx-auto mb-4 text-error">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-muted-foreground font-serif max-w-md">
        An error occurred while loading this page or querying your sources.
      </p>

      {error.message && (
        <div className="mt-4 p-3 rounded-xl bg-surface-raised border border-border text-xs text-error font-mono max-w-md overflow-x-auto text-left">
          {error.message}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="primary" size="md" onClick={() => reset()}>
          <RotateCcw className="h-4 w-4 mr-1.5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}
