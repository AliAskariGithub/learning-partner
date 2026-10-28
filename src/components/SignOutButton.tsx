'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push('/sign-in');
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-3.5 py-1.5 text-xs font-medium rounded-lg text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition"
    >
      Sign out
    </button>
  );
}
