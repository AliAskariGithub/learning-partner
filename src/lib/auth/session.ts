import { auth } from './server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { neon } from '@neondatabase/serverless';

export async function getSession() {
  const { data: session } = await auth.getSession();
  return session;
}

export async function isUserEmailVerified(userId: string): Promise<boolean> {
  try {
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql.query(
        `SELECT "emailVerified" FROM neon_auth.user WHERE id = $1 LIMIT 1`,
        [userId]
      );
      if (rows && rows.length > 0) {
        return Boolean(rows[0].emailVerified);
      }
    }
  } catch (err) {
    console.error('Error checking isUserEmailVerified:', err);
  }
  return false;
}

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/sign-in');
  }

  let verified = Boolean((session.user as any).emailVerified);
  try {
    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql.query(
        `SELECT "emailVerified" FROM neon_auth.user WHERE id = $1 LIMIT 1`,
        [session.user.id]
      );
      if (rows && rows.length > 0) {
        verified = Boolean(rows[0].emailVerified);
      }
    }
  } catch {}

  return {
    ...session.user,
    emailVerified: verified,
  };
}

export async function getOrCreateProfile(user: {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const existing = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, user.id))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [created] = await db
    .insert(profiles)
    .values({
      authUserId: user.id,
      displayName: user.name || user.email?.split('@')[0] || 'Learner',
      avatarUrl: user.image || null,
    })
    .returning();

  return created;
}
