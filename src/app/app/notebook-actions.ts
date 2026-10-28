'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/db';
import { notebooks, sources, sourceChunks, notes } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { getStorageAdapter } from '@/lib/storage';
import { processSourceIngestion } from '@/lib/ingestion';
import { STORAGE_LIMITS } from '@/config/limits';

// 1. Fetch all notebooks for the signed-in user
export async function getUserNotebooks() {
  const user = await requireUser();
  return db
    .select()
    .from(notebooks)
    .where(eq(notebooks.userId, user.id))
    .orderBy(desc(notebooks.pinned), desc(notebooks.updatedAt));
}

// 2. Fetch single notebook with its sources and notes
export async function getNotebookDetails(notebookId: string) {
  const user = await requireUser();

  const [notebook] = await db
    .select()
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));

  if (!notebook) return null;

  const notebookSources = await db
    .select()
    .from(sources)
    .where(and(eq(sources.notebookId, notebookId), eq(sources.userId, user.id)))
    .orderBy(desc(sources.createdAt));

  const notebookNotes = await db
    .select()
    .from(notes)
    .where(and(eq(notes.notebookId, notebookId), eq(notes.userId, user.id)))
    .orderBy(desc(notes.createdAt));

  return {
    notebook,
    sources: notebookSources,
    notes: notebookNotes,
  };
}

// 3. Create Notebook
export async function createNotebook(formData: FormData) {
  const user = await requireUser();
  const title = (formData.get('title') as string) || 'Untitled Study Notebook';
  const description = (formData.get('description') as string) || '';

  const [newNotebook] = await db
    .insert(notebooks)
    .values({
      userId: user.id,
      title: title.trim(),
      description: description.trim() || null,
      instructions:
        'ROLE You are my personal study partner. Answer questions strictly grounded in my uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.',
    })
    .returning();

  revalidatePath('/app');
  return newNotebook;
}

// 4. Update Notebook Metadata
export async function updateNotebook(
  notebookId: string,
  data: {
    title?: string;
    description?: string;
    instructions?: string;
    pinned?: boolean;
  }
) {
  const user = await requireUser();

  const [updated] = await db
    .update(notebooks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)))
    .returning();

  revalidatePath(`/app/notebooks/${notebookId}`);
  revalidatePath('/app');
  return updated;
}

// 5. Delete Notebook
export async function deleteNotebook(notebookId: string) {
  const user = await requireUser();

  await db
    .delete(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));

  revalidatePath('/app');
  return { success: true };
}

// 6. Source Management: Toggle Enabled
export async function toggleSourceEnabled(sourceId: string, enabled: boolean) {
  const user = await requireUser();

  const [updated] = await db
    .update(sources)
    .set({ enabled, updatedAt: new Date() })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)))
    .returning();

  return updated;
}

// 7. Source Management: Rename Source
export async function renameSource(sourceId: string, title: string) {
  const user = await requireUser();

  const [updated] = await db
    .update(sources)
    .set({ title: title.trim(), updatedAt: new Date() })
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)))
    .returning();

  return updated;
}

// 8. Source Management: Delete Source
export async function deleteSource(sourceId: string) {
  const user = await requireUser();

  const [sourceRecord] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)));

  if (sourceRecord) {
    if (sourceRecord.storageKey) {
      try {
        const storage = getStorageAdapter();
        await storage.delete(sourceRecord.storageKey);
      } catch (e) {
        console.error('Error deleting file from storage adapter:', e);
      }
    }
    await db.delete(sources).where(eq(sources.id, sourceId));
  }

  return { success: true };
}

// 9. Source Management: Retry Ingestion
export async function retrySource(sourceId: string) {
  const user = await requireUser();

  const [sourceRecord] = await db
    .select()
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.userId, user.id)));

  if (!sourceRecord) throw new Error('Source not found.');

  if (sourceRecord.type === 'url' && sourceRecord.originalUrl) {
    processSourceIngestion(sourceId, { url: sourceRecord.originalUrl }).catch(console.error);
  } else if (sourceRecord.type === 'text' && sourceRecord.extractedText) {
    processSourceIngestion(sourceId, { rawText: sourceRecord.extractedText }).catch(console.error);
  } else {
    // Attempt re-reading from storage if available
    throw new Error('Please re-upload this file to retry ingestion.');
  }

  return { success: true };
}

// 10. Notes: Create Saved Note (Project Memory)
export async function createNote(notebookId: string, title: string, content: string) {
  const user = await requireUser();

  const [newNote] = await db
    .insert(notes)
    .values({
      notebookId,
      userId: user.id,
      title: title.trim(),
      content: content.trim(),
    })
    .returning();

  revalidatePath(`/app/notebooks/${notebookId}`);
  return newNote;
}

// 11. Notes: Update Saved Note
export async function updateNote(noteId: string, title: string, content: string) {
  const user = await requireUser();

  const [updated] = await db
    .update(notes)
    .set({
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)))
    .returning();

  return updated;
}

// 12. Notes: Delete Saved Note
export async function deleteNote(noteId: string) {
  const user = await requireUser();

  await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, user.id)));

  return { success: true };
}

// 13. Fetch Source Chunks for Viewer
export async function getSourceChunks(sourceId: string) {
  const user = await requireUser();

  return db
    .select()
    .from(sourceChunks)
    .where(and(eq(sourceChunks.sourceId, sourceId), eq(sourceChunks.userId, user.id)))
    .orderBy(sourceChunks.chunkIndex);
}
