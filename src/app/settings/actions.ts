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
  sourceChunks,
} from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
    };

    return { success: true, data: exportPayload };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to export user data.' };
  }
}

/**
 * Permanently deletes user's account and all associated data across all tables.
 */
export async function deleteAccountAndData(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    // 1. Delete source chunks, sources, notes, outputs, messages, conversations, notebooks
    await db.delete(sourceChunks).where(eq(sourceChunks.userId, user.id));
    await db.delete(outputs).where(eq(outputs.userId, user.id));
    await db.delete(notes).where(eq(notes.userId, user.id));
    await db.delete(sources).where(eq(sources.userId, user.id));
    await db.delete(conversations).where(eq(conversations.userId, user.id));
    await db.delete(apiKeys).where(eq(apiKeys.userId, user.id));
    await db.delete(notebooks).where(eq(notebooks.userId, user.id));
    await db.delete(profiles).where(eq(profiles.authUserId, user.id));

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete account data.' };
  }
}


