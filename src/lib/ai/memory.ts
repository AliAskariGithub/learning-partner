import { db } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  notebookMemory,
  memoryItems,
  messageChunks,
  notebooks,
  MemoryItem,
  MemoryItemType,
  memoryItemTypeEnum,
  Message,
} from '@/db/schema';
import { STORAGE_LIMITS } from '@/config/limits';
import { filterSecrets, estimateTokens } from '@/lib/ai/context';
import { generateObject } from 'ai';
import { createProviderModel } from '@/lib/ai/factory';
import { getCredentialsForRequest } from '@/lib/connections/resolver';
import { getModelDefinition, PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { z } from 'zod';

/**
 * Retrieves the single shared markdown memory summary for a notebook.
 */
export async function getNotebookMemory(notebookId: string, userId: string) {
  const [existing] = await db
    .select()
    .from(notebookMemory)
    .where(and(eq(notebookMemory.notebookId, notebookId), eq(notebookMemory.userId, userId)))
    .limit(1);

  return existing || null;
}

/**
 * Retrieves all durable memory items for a notebook, ordered with pinned first.
 */
export async function getNotebookMemoryItems(notebookId: string, userId: string) {
  return db
    .select()
    .from(memoryItems)
    .where(and(eq(memoryItems.notebookId, notebookId), eq(memoryItems.userId, userId)))
    .orderBy(desc(memoryItems.pinned), desc(memoryItems.updatedAt));
}

/**
 * Indexes a chat message into `message_chunks` with full-text search tsvector.
 */
export async function indexMessageChunk(params: {
  conversationId: string;
  messageId?: string;
  notebookId: string;
  userId: string;
  content: string;
}) {
  const { conversationId, messageId, notebookId, userId, content } = params;
  if (!content?.trim()) return;

  const sanitized = filterSecrets(content.trim());
  try {
    await db.insert(messageChunks).values({
      conversationId,
      messageId: messageId || null,
      notebookId,
      userId,
      content: sanitized,
      searchVector: sql`to_tsvector('english', ${sanitized})`,
    });
  } catch (err) {
    console.warn('Failed to index message chunk:', err);
  }
}

/**
 * Performs cross-conversation hybrid search across past messages in this notebook.
 */
export async function searchPastConversationSnippets(params: {
  notebookId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<Array<{ conversationId: string; title: string; snippet: string }>> {
  const { notebookId, userId, query, limit = 4 } = params;
  if (!query?.trim()) return [];

  const cleanQuery = query
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .join(' | ');

  if (!cleanQuery) return [];

  try {
    const results = await db.execute<{
      conversation_id: string;
      content: string;
      rank: number;
    }>(sql`
      SELECT mc.conversation_id, mc.content, ts_rank(mc.search_vector, to_tsquery('english', ${cleanQuery})) as rank
      FROM message_chunks mc
      WHERE mc.notebook_id = ${notebookId}
        AND mc.user_id = ${userId}
        AND mc.search_vector @@ to_tsquery('english', ${cleanQuery})
      ORDER BY rank DESC
      LIMIT ${limit};
    `);

    const rows = results.rows || [];
    return rows.map((r: any) => ({
      conversationId: r.conversation_id,
      title: 'Previous Notebook Discussion',
      snippet: r.content.slice(0, 300).trim(),
    }));
  } catch (err) {
    console.warn('Hybrid search past conversation query fallback:', err);
    return [];
  }
}

const memoryExtractionSchema = z.object({
  summary: z.string().describe('Updated cohesive markdown summary of learner context, goals, and knowledge under 200 words'),
  extractedItems: z.array(
    z.object({
      type: z.enum(memoryItemTypeEnum),
      text: z.string().describe('Concise statement of learner goal, misconception, preference, or fact'),
      confidence: z.number().min(50).max(100).default(85),
    })
  ),
});

/**
 * Background Consolidation Pipeline:
 * Uses the cheapest suitable model available to extract durable items,
 * deduplicate and merge into shared notebook memory, resolve conflicts,
 * and rewrite the compact summary under 1,500 tokens.
 */
export async function consolidateNotebookMemory(params: {
  notebookId: string;
  userId: string;
  conversationId: string;
  mode: 'chat' | 'learn' | 'quiz';
  recentMessages: Message[];
}) {
  const { notebookId, userId, conversationId, mode, recentMessages } = params;
  if (!recentMessages || recentMessages.length === 0) return;

  // 1. Verify notebook has memory enabled
  const [notebook] = await db
    .select({ useMemory: notebooks.useMemory })
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)))
    .limit(1);

  if (notebook && notebook.useMemory === false) {
    return; // User disabled memory in chats
  }

  // 2. Resolve cheapest suitable AI model for memory processing
  // Priority: gemini-3.5-flash / flash-lite / groq-llama
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'groq-llama-3.3-70b',
    'gpt-4o-mini',
  ];

  let resolvedCreds = null;
  let selectedModelId = candidateModels[0];

  for (const candidate of candidateModels) {
    const creds = await getCredentialsForRequest(userId, candidate).catch(() => null);
    if (creds?.apiKey) {
      resolvedCreds = creds;
      selectedModelId = candidate;
      break;
    }
  }

  if (!resolvedCreds?.apiKey) {
    // If no candidate key found, skip memory consolidation gracefully
    return;
  }

  const modelDef = getModelDefinition(selectedModelId);
  const aiModel = createProviderModel({
    provider: modelDef.provider,
    apiKey: resolvedCreds.apiKey,
    modelId: modelDef.id,
    customBaseUrl: resolvedCreds.customBaseUrl,
  });

  // 3. Load existing memory summary and items
  const currentMemory = await getNotebookMemory(notebookId, userId);
  const existingItems = await getNotebookMemoryItems(notebookId, userId);

  const conversationTranscript = recentMessages
    .slice(-4)
    .map((m) => `${m.role.toUpperCase()}: ${filterSecrets(m.content)}`)
    .join('\n');

  try {
    const { object } = await generateObject({
      model: aiModel,
      schema: memoryExtractionSchema,
      system: `You are an expert memory consolidation assistant for an AI study app.
Analyze the latest exchange between learner and assistant.
Extract ONLY durable learner signals across these categories:
- goal: what the student wants to learn or accomplish
- preference: learning style, pace, language, format preferences
- knowledge_level: current mastery or background in the topic
- misconception: specific errors, confusion or faulty intuition demonstrated
- weak_topic: concepts the learner struggled with
- strong_topic: concepts the learner answered correctly or demonstrated confidence in
- decision: architectural or study decisions made
- fact: specific personal study constraints (e.g. "exam on Friday")

RULES:
- Do NOT store secrets, passwords, or transient chatter.
- Text descriptions only (never image binaries).
- Output a cohesive updated summary synthesizing current memory with new insights under 1,500 tokens.`,
      prompt: `CURRENT MEMORY SUMMARY:\n${currentMemory?.summary || 'None yet.'}

EXISTING ITEMS:
${existingItems.map((item) => `- [${item.type}] ${item.text}`).join('\n') || 'None'}

LATEST EXCHANGE (${mode.toUpperCase()} MODE):
${conversationTranscript}`,
    });

    if (!object) return;

    // 4. Update or Insert Notebook Memory Record
    const newSummary = filterSecrets(object.summary.slice(0, 4000));
    if (currentMemory) {
      await db
        .update(notebookMemory)
        .set({
          summary: newSummary,
          version: currentMemory.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(notebookMemory.id, currentMemory.id));
    } else {
      await db.insert(notebookMemory).values({
        notebookId,
        userId,
        summary: newSummary,
        version: 1,
      });
    }

    // 5. Deduplicate and insert new memory items
    const existingTexts = new Set(existingItems.map((i) => i.text.toLowerCase().trim()));

    for (const newItem of object.extractedItems) {
      const cleanText = filterSecrets(newItem.text.trim());
      if (!cleanText || existingTexts.has(cleanText.toLowerCase())) continue;

      // Check if this updates an existing misconception or weak_topic
      const conflictItem = existingItems.find(
        (i) => i.type === newItem.type && i.text.toLowerCase().includes(cleanText.toLowerCase().slice(0, 24))
      );

      if (conflictItem && !conflictItem.pinned) {
        await db
          .update(memoryItems)
          .set({
            text: cleanText,
            confidence: newItem.confidence || 85,
            sourceConversationId: conversationId,
            sourceMode: mode,
            updatedAt: new Date(),
          })
          .where(eq(memoryItems.id, conflictItem.id));
      } else {
        await db.insert(memoryItems).values({
          notebookId,
          userId,
          type: newItem.type,
          text: cleanText,
          sourceConversationId: conversationId,
          sourceMode: mode,
          confidence: newItem.confidence || 85,
          pinned: false,
        });
      }
      existingTexts.add(cleanText.toLowerCase());
    }

    // 6. Enforce memory cap (compress oldest unpinned if count > 250)
    const updatedItems = await getNotebookMemoryItems(notebookId, userId);
    const maxItems = STORAGE_LIMITS.MEMORY_LIMITS.MAX_ITEMS_PER_NOTEBOOK;
    if (updatedItems.length > maxItems) {
      const unpinnedOldest = updatedItems
        .filter((item) => !item.pinned)
        .slice(maxItems - 20); // trim surplus
      for (const item of unpinnedOldest) {
        await db.delete(memoryItems).where(eq(memoryItems.id, item.id));
      }
    }
  } catch (consolidationErr) {
    console.warn('Memory consolidation warning:', consolidationErr);
  }
}

/**
 * Removes all memory items derived from a specific conversation when deleted.
 */
export async function forgetConversationMemory(conversationId: string, userId: string) {
  return db
    .delete(memoryItems)
    .where(
      and(
        eq(memoryItems.sourceConversationId, conversationId),
        eq(memoryItems.userId, userId)
      )
    );
}

/**
 * Deletes a single memory item by ID.
 */
export async function deleteMemoryItem(id: string, userId: string) {
  return db
    .delete(memoryItems)
    .where(and(eq(memoryItems.id, id), eq(memoryItems.userId, userId)));
}

/**
 * Toggles pinned state for a memory item.
 */
export async function togglePinMemoryItem(id: string, userId: string, pinned: boolean) {
  return db
    .update(memoryItems)
    .set({ pinned, updatedAt: new Date() })
    .where(and(eq(memoryItems.id, id), eq(memoryItems.userId, userId)));
}

/**
 * Updates text of a memory item.
 */
export async function updateMemoryItemText(id: string, userId: string, text: string) {
  return db
    .update(memoryItems)
    .set({ text: filterSecrets(text.trim()), updatedAt: new Date() })
    .where(and(eq(memoryItems.id, id), eq(memoryItems.userId, userId)));
}

/**
 * Clears all memory for a notebook (summary and items).
 */
export async function clearNotebookMemory(notebookId: string, userId: string) {
  await db
    .delete(notebookMemory)
    .where(and(eq(notebookMemory.notebookId, notebookId), eq(notebookMemory.userId, userId)));

  await db
    .delete(memoryItems)
    .where(and(eq(memoryItems.notebookId, notebookId), eq(memoryItems.userId, userId)));
}

/**
 * Exports notebook memory as a structured Markdown document.
 */
export async function exportNotebookMemoryMarkdown(notebookId: string, userId: string): Promise<string> {
  const memory = await getNotebookMemory(notebookId, userId);
  const items = await getNotebookMemoryItems(notebookId, userId);

  const lines: string[] = [
    `# Notebook Memory Summary`,
    ``,
    memory?.summary || '*No summary generated yet.*',
    ``,
    `## Durable Learner Context Items`,
    ``,
  ];

  if (items.length === 0) {
    lines.push(`*No memory items recorded.*`);
  } else {
    for (const item of items) {
      const pinTag = item.pinned ? ' 📌 [Pinned]' : '';
      lines.push(`- **[${item.type.toUpperCase()}]**${pinTag}: ${item.text}`);
    }
  }

  return lines.join('\n');
}

