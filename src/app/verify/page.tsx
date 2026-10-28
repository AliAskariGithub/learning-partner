import { Suspense } from 'react';
import { VerifyClient } from './VerifyClient';

export const metadata = {
  title: 'Verify Your Email | Learning Partner',
  description: 'Enter the 6-digit confirmation code sent to your email to verify your Learning Partner account.',
};

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}

