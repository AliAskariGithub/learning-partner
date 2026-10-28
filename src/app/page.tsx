import { getSession } from '@/lib/auth/session';
import { LandingClient } from './LandingClient';

export const instant = false;

export default async function HomePage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return <LandingClient isLoggedIn={isLoggedIn} />;
}
