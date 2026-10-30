'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/db';
import {
  profiles,
  notebooks,
  sources,
  notes,
  conversations,
  messages,
  outputs,
  apiKeys,
  connections,
  sourceChunks,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { neon } from '@neondatabase/serverless';

export async function updateProfileSettings(formData: FormData) {
  const user = await requireUser();
  
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  };

  if (formData.has('displayName')) {
    const rawName = formData.get('displayName') as string;
    updateData.displayName = rawName ? rawName.trim() : null;
  }

  if (formData.has('customInstructions')) {
    const rawInst = formData.get('customInstructions') as string;
    updateData.customInstructions = rawInst ? rawInst.trim() : null;
  }

  if (formData.has('preferredLanguage')) {
    const rawLang = formData.get('preferredLanguage') as string;
    if (rawLang && rawLang.trim()) {
      updateData.preferredLanguage = rawLang.trim();
    }
  }

  if (formData.has('avatarUrl')) {
    const rawAvatar = formData.get('avatarUrl') as string;
    updateData.avatarUrl = rawAvatar ? rawAvatar.trim() : null;
  }

  await db
    .update(profiles)
    .set(updateData)
    .where(eq(profiles.authUserId, user.id));

  revalidatePath('/settings');
  revalidatePath('/app', 'layout');

  return { success: true };
}

/**
 * Exports all user data across all tables into a structured JSON backup.
 */
export async function exportUserData(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const user = await requireUser();

    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.authUserId, user.id));

    const userNotebooks = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.userId, user.id));

    const userSources = await db
      .select({
        id: sources.id,
        notebookId: sources.notebookId,
        type: sources.type,
        title: sources.title,
        originalUrl: sources.originalUrl,
        wordCount: sources.wordCount,
        status: sources.status,
        createdAt: sources.createdAt,
      })
      .from(sources)
      .where(eq(sources.userId, user.id));

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, user.id));

    const userConvs = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id));

    const userOutputs = await db
      .select()
      .from(outputs)
      .where(eq(outputs.userId, user.id));

    const userConns = await db
      .select({
        id: connections.id,
        provider: connections.provider,
        method: connections.method,
        callMode: connections.callMode,
        accountLabel: connections.accountLabel,
        status: connections.status,
        createdAt: connections.createdAt,
      })
      .from(connections)
      .where(eq(connections.userId, user.id));

    const exportPayload = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile: userProfile || null,
      notebooks: userNotebooks,
      sources: userSources,
      notes: userNotes,
      conversations: userConvs,
      studioOutputs: userOutputs,
      aiConnections: userConns,
    };

    return { success: true, data: exportPayload };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to export user data.' };
  }
}

/**
 * Permanently deletes user's account and all associated data across all tables,
 * and completely removes user identity and email from Neon Auth.
 */
export async function deleteAccountAndData(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const userId = user.id;

    if (process.env.DATABASE_URL) {
      const sql = neon(process.env.DATABASE_URL);

      // 1. Delete dependent content tables in public schema
      await sql`DELETE FROM source_chunks WHERE user_id = ${userId}`;
      await sql`DELETE FROM sources WHERE user_id = ${userId}`;
      await sql`DELETE FROM outputs WHERE user_id = ${userId}`;
      await sql`DELETE FROM notes WHERE user_id = ${userId}`;

      // Delete messages associated with user's conversations
      await sql`DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE user_id = ${userId})`;
      await sql`DELETE FROM conversations WHERE user_id = ${userId}`;

      // Delete notebooks, connections, api keys, profile
      await sql`DELETE FROM notebooks WHERE user_id = ${userId}`;
      await sql`DELETE FROM connections WHERE user_id = ${userId}`;
      await sql`DELETE FROM api_keys WHERE user_id = ${userId}`;
      await sql`DELETE FROM profiles WHERE auth_user_id = ${userId}`;

      // 2. Wipe identity & email from Neon Auth (cascades sessions, accounts, invitations, members)
      await sql`DELETE FROM neon_auth.user WHERE id = ${userId}`;
    } else {
      // Fallback via Drizzle
      await db.delete(sourceChunks).where(eq(sourceChunks.userId, userId));
      await db.delete(sources).where(eq(sources.userId, userId));
      await db.delete(outputs).where(eq(outputs.userId, userId));
      await db.delete(notes).where(eq(notes.userId, userId));
      await db.delete(conversations).where(eq(conversations.userId, userId));
      await db.delete(notebooks).where(eq(notebooks.userId, userId));
      await db.delete(connections).where(eq(connections.userId, userId));
      await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
      await db.delete(profiles).where(eq(profiles.authUserId, userId));
    }

    // 3. Clear all authentication and state cookies
    const cookieStore = await cookies();
    cookieStore.delete('neon_auth_session');
    cookieStore.delete('lp_session');
    cookieStore.delete('lp_csrf');
    cookieStore.delete('lp_oauth_state');
    cookieStore.delete('lp_consent');

    return { success: true };
  } catch (err: any) {
    console.error('deleteAccountAndData error:', err);
    return { success: false, error: err.message || 'Failed to delete account data.' };
  }
}
