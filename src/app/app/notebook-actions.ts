'use server';

import { requireUser } from '@/lib/auth/session';
import { db } from '@/db';
import { notebooks, sources, sourceChunks, notes, conversations } from '@/db/schema';
import { and, eq, desc, asc, isNull } from 'drizzle-orm';
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

  // Backfill legacy notes without conversation_id to the earliest conversation of the notebook
  const legacyNotes = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.notebookId, notebookId), isNull(notes.conversationId)))
    .limit(1);

  if (legacyNotes.length > 0) {
    const [oldestConv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.notebookId, notebookId))
      .orderBy(asc(conversations.createdAt))
      .limit(1);

    if (oldestConv) {
      await db
        .update(notes)
        .set({ conversationId: oldestConv.id })
        .where(and(eq(notes.notebookId, notebookId), isNull(notes.conversationId)));
    }
  }

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
  } else if (sourceRecord.storageKey) {
    try {
      const storage = getStorageAdapter();
      const buffer = await storage.get(sourceRecord.storageKey);
      processSourceIngestion(sourceId, { buffer }).catch(console.error);
    } catch (err: any) {
      throw new Error(`Could not retrieve stored file: ${err?.message || 'File missing'}. Please re-upload.`);
    }
  } else {
    throw new Error('Please re-upload this file to retry ingestion.');
  }

  return { success: true };
}

// 10. Notes: Create Saved Note (Project Memory)
export async function createNote(
  notebookId: string,
  title: string,
  content: string,
  conversationId?: string | null
) {
  const user = await requireUser();

  const [newNote] = await db
    .insert(notes)
    .values({
      notebookId,
      conversationId: conversationId || null,
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

// 14. Fetch all notes (Memory) for a notebook (or filtered by conversation)
export async function getNotebookNotes(notebookId: string, conversationId?: string | null) {
  const user = await requireUser();
  return db
    .select()
    .from(notes)
    .where(
      conversationId
        ? and(
            eq(notes.notebookId, notebookId),
            eq(notes.userId, user.id),
            eq(notes.conversationId, conversationId)
          )
        : and(eq(notes.notebookId, notebookId), eq(notes.userId, user.id))
    )
    .orderBy(desc(notes.createdAt));
}

// -------------------------------------------------------------
// Phase 6: Shared Notebook Memory Actions
// -------------------------------------------------------------
import {
  getNotebookMemory,
  getNotebookMemoryItems,
  togglePinMemoryItem,
  updateMemoryItemText,
  deleteMemoryItem,
  clearNotebookMemory,
  exportNotebookMemoryMarkdown,
  forgetConversationMemory,
} from '@/lib/ai/memory';
import {
  getNotebookQuizHistory,
  saveQuizAttempt,
} from '@/lib/ai/quiz';

export async function getNotebookMemoryData(notebookId: string) {
  const user = await requireUser();
  const memory = await getNotebookMemory(notebookId, user.id);
  const items = await getNotebookMemoryItems(notebookId, user.id);
  return { memory, items };
}

export async function toggleNotebookUseMemory(notebookId: string, enabled: boolean) {
  const user = await requireUser();
  await db
    .update(notebooks)
    .set({ useMemory: enabled, updatedAt: new Date() })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));
  return { success: true };
}

export async function updateNotebookMode(notebookId: string, mode: 'chat' | 'learn' | 'quiz') {
  const user = await requireUser();
  await db
    .update(notebooks)
    .set({ lastMode: mode, updatedAt: new Date() })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));
  return { success: true };
}

export async function updateNotebookLearningGrounding(
  notebookId: string,
  grounding: 'sources_only' | 'sources_first'
) {
  const user = await requireUser();
  await db
    .update(notebooks)
    .set({ learningModeGrounding: grounding, updatedAt: new Date() })
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));
  return { success: true };
}

export async function pinMemoryItemAction(id: string, pinned: boolean) {
  const user = await requireUser();
  await togglePinMemoryItem(id, user.id, pinned);
  return { success: true };
}

export async function editMemoryItemAction(id: string, text: string) {
  const user = await requireUser();
  await updateMemoryItemText(id, user.id, text);
  return { success: true };
}

export async function deleteMemoryItemAction(id: string) {
  const user = await requireUser();
  await deleteMemoryItem(id, user.id);
  return { success: true };
}

export async function clearNotebookMemoryAction(notebookId: string) {
  const user = await requireUser();
  await clearNotebookMemory(notebookId, user.id);
  return { success: true };
}

export async function exportNotebookMemoryAction(notebookId: string) {
  const user = await requireUser();
  return exportNotebookMemoryMarkdown(notebookId, user.id);
}

export async function forgetConversationMemoryAction(conversationId: string) {
  const user = await requireUser();
  await forgetConversationMemory(conversationId, user.id);
  return { success: true };
}

// -------------------------------------------------------------
// Phase 6: Quiz Attempts and Scoring Actions
// -------------------------------------------------------------
export async function getNotebookQuizHistoryAction(notebookId: string) {
  const user = await requireUser();
  return getNotebookQuizHistory(notebookId, user.id);
}

export async function recordQuizAttemptAction(params: {
  quizId: string;
  notebookId: string;
  answers: Record<string, any>;
  perQuestionResults: any[];
  durationSeconds: number;
}) {
  const user = await requireUser();
  return saveQuizAttempt({
    ...params,
    userId: user.id,
  });
}

