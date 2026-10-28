import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-6 font-display font-black text-2xl text-brand-400">
        404
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
        Page Not Found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground font-serif max-w-sm">
        The study notebook or page you are looking for doesn&apos;t exist or may have been moved.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/">
          <Button variant="secondary" size="md">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Home
          </Button>
        </Link>
        <Link href="/app">
          <Button variant="primary" size="md">
            Go to App
          </Button>
        </Link>
      </div>
    </div>
  );
}
