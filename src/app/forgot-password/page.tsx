import { Suspense } from 'react';
import { ForgotPasswordClient } from './ForgotPasswordClient';

export const metadata = {
  title: 'Forgot Password | Learning Partner',
  description: 'Recover your Learning Partner account with a secure 6-digit verification code.',
};

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ForgotPasswordClient />
    </Suspense>
  );
}

