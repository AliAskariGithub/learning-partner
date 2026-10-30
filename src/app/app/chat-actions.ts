'use server';

import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/db';
import {
  conversations,
  messages,
  notes,
  notebooks,
  Conversation,
  Message,
  Citation,
} from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { revalidatePath } from 'next/cache';

export async function getConversations(notebookId: string): Promise<Conversation[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.notebookId, notebookId),
        eq(conversations.userId, session.user.id)
      )
    )
    .orderBy(desc(conversations.createdAt));
}

export async function getConversationMessages(conversationId: string, clientUserId?: string): Promise<Message[]> {
  try {
    const session = await getSession();
    const effectiveUserId = session?.user?.id || clientUserId;
    if (!effectiveUserId) return [];

    // Verify conversation belongs to user
    const [conv] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, effectiveUserId)
        )
      )
      .limit(1);

    if (!conv) return [];

    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));
  } catch (err) {
    console.error('getConversationMessages error:', err);
    return [];
  }
}

export async function createConversation(params: {
  notebookId: string;
  model: string;
  mode: 'chat' | 'learn' | 'quiz';
  title?: string;
}): Promise<Conversation> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [created] = await db
    .insert(conversations)
    .values({
      notebookId: params.notebookId,
      userId: session.user.id,
      title: params.title || 'New Conversation',
      mode: params.mode || 'chat',
      model: params.model,
    })
    .returning();

  // Remember the model on the notebook
  await db
    .update(notebooks)
    .set({ lastModel: params.model })
    .where(and(eq(notebooks.id, params.notebookId), eq(notebooks.userId, session.user.id)))
    .catch(() => {});

  revalidatePath(`/app/notebooks/${params.notebookId}`);
  return created;
}

export async function updateConversationTitle(conversationId: string, title: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(conversations)
    .set({ title: title.trim(), updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    );

  return { success: true };
}

export async function deleteConversation(conversationId: string, notebookId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.userId, session.user.id)
      )
    );

  revalidatePath(`/app/notebooks/${notebookId}`);
  return { success: true };
}

export async function saveNoteFromMessage(params: {
  notebookId: string;
  conversationId?: string | null;
  title: string;
  content: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [saved] = await db
    .insert(notes)
    .values({
      notebookId: params.notebookId,
      conversationId: params.conversationId || null,
      userId: session.user.id,
      title: params.title.trim() || 'Saved Insight',
      content: params.content.trim(),
    })
    .returning();

  revalidatePath(`/app/notebooks/${params.notebookId}`);
  return saved;
}

export async function deleteMessage(messageId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [msg] = await db
    .select({ id: messages.id, conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) return { success: false };

  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, msg.conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!conv) throw new Error('Unauthorized');

  await db.delete(messages).where(eq(messages.id, messageId));
  return { success: true };
}

export async function updateMessage(messageId: string, content: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [msg] = await db
    .select({ id: messages.id, conversationId: messages.conversationId })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) return { success: false };

  const [conv] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, msg.conversationId),
        eq(conversations.userId, session.user.id)
      )
    )
    .limit(1);

  if (!conv) throw new Error('Unauthorized');

  await db
    .update(messages)
    .set({ content: content.trim() })
    .where(eq(messages.id, messageId));

  return { success: true };
}

export async function saveBrowserChatMessage(params: {
  conversationId: string;
  notebookId: string;
  content: string;
  citations?: Citation[];
  userPrompt?: string;
}): Promise<Message> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [saved] = await db
    .insert(messages)
    .values({
      conversationId: params.conversationId,
      role: 'assistant',
      content: params.content,
      citations: params.citations || null,
    })
    .returning();

  // If there is userPrompt, save auto memory note
  if (params.userPrompt) {
    try {
      const memoryTitle = params.userPrompt.slice(0, 42).replace(/[*_#]/g, '').trim();
      const memoryContent = `Q: ${params.userPrompt.trim()}\nA: ${params.content.slice(0, 360).trim()}...`;
      await db.insert(notes).values({
        notebookId: params.notebookId,
        conversationId: params.conversationId || null,
        userId: session.user.id,
        title: memoryTitle || 'Chat Context Takeaway',
        content: memoryContent,
      });
    } catch (memErr) {
      console.warn('Auto memory save error:', memErr);
    }

    // Check past messages count to update title if first turn
    try {
      const pastMsgs = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.conversationId, params.conversationId));

      if (pastMsgs.length <= 2) {
        const cleanTitle = params.userPrompt
          .replace(/^(what is|who is|explain|summarize|how to)\s+/i, '')
          .slice(0, 36)
          .trim();
        if (cleanTitle) {
          await db
            .update(conversations)
            .set({
              title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
              updatedAt: new Date(),
            })
            .where(eq(conversations.id, params.conversationId));
        }
      }
    } catch {}
  }

  revalidatePath(`/app/notebooks/${params.notebookId}`);
  return saved;
}



