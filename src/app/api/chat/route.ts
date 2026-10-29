import { NextRequest } from 'next/server';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/db';
import {
  notebooks,
  profiles,
  notes,
  conversations,
  messages,
} from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { getModelDefinition, PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { getDecryptedKeyForProvider } from '@/app/app/api-key-actions';
import { createProviderModel } from '@/lib/ai/factory';
import { retrieveNotebookContext, backfillChunkEmbeddings } from '@/lib/rag/retrieval';
import { assembleSystemPrompt, ChatMode } from '@/lib/ai/prompts';
import { streamText } from 'ai';

export const maxDuration = 60; // Allow up to 60s for streaming responses

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in to chat.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const userId = session.user.id;

    // 2. Check rate limit (30 requests / min)
    const rateLimit = checkRateLimit(userId, 30, 60000);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Rate limit reached. Please wait ${rateLimit.retryAfter} seconds before sending another message.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request payload
    const body = await req.json();
    const {
      notebookId,
      conversationId: incomingConvId,
      message,
      modelId = 'gemini-3.8-flash',
      mode = 'chat',
    } = body as {
      notebookId: string;
      conversationId?: string | null;
      message: string;
      modelId?: string;
      mode?: ChatMode;
    };

    if (!notebookId || !message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Missing required notebookId or message.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Resolve Model and verify capability
    const modelDef = getModelDefinition(modelId);

    // Capability check: Quiz mode requires structured output
    if (mode === 'quiz' && !modelDef.capabilities.structuredOutput) {
      return new Response(
        JSON.stringify({
          error: `The selected model (${modelDef.name}) does not support Quiz mode (requires structured output). Please switch to a supported model.`,
          code: 'CAPABILITY_UNSUPPORTED',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let keyInfo = await getDecryptedKeyForProvider(userId, modelDef.provider);

    // If no key found for selected provider, check if Google Gemini default is available
    if (!keyInfo && process.env.GOOGLE_GENERATIVE_AI_API_KEY && modelDef.provider === 'google') {
      keyInfo = {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        customBaseUrl: null,
        keyId: 'env-default',
      };
    }

    if (!keyInfo) {
      const providerMeta = PROVIDER_REGISTRY[modelDef.provider];
      return new Response(
        JSON.stringify({
          error: `No active API key found for ${providerMeta?.name || modelDef.provider}. Please add your key in the model switcher or Settings.`,
          code: 'KEY_MISSING',
          provider: modelDef.provider,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Fetch Notebook and verify ownership
    const [notebook] = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)))
      .limit(1);

    if (!notebook) {
      return new Response(
        JSON.stringify({ error: 'Notebook not found.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Fetch Profile (user custom instructions) and Saved Notes (memory)
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.authUserId, userId))
      .limit(1);

    const savedNotes = await db
      .select({ title: notes.title, content: notes.content })
      .from(notes)
      .where(and(eq(notes.notebookId, notebookId), eq(notes.userId, userId)))
      .orderBy(desc(notes.createdAt))
      .limit(15);

    // 7. Hybrid RAG Retrieval over enabled sources
    const retrieval = await retrieveNotebookContext({
      notebookId,
      userId,
      query: message,
      maxTokens: Math.min(16000, Math.floor(modelDef.capabilities.contextWindow * 0.4)),
    });

    // 8. Assemble Grounded System Prompt
    const systemPrompt = assembleSystemPrompt({
      mode,
      userCustomInstructions: profile?.customInstructions,
      notebookInstructions: notebook.instructions,
      memoryNotes: savedNotes,
      formattedSourcesContext: retrieval.formattedContext,
    });

    // 9. Resolve Conversation
    let activeConversationId = incomingConvId;
    if (activeConversationId) {
      const [existing] = await db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, activeConversationId),
            eq(conversations.userId, userId)
          )
        )
        .limit(1);

      if (!existing) {
        activeConversationId = null;
      }
    }

    if (!activeConversationId) {
      const initialTitle = message.slice(0, 42).trim() + (message.length > 42 ? '...' : '');
      const [newConv] = await db
        .insert(conversations)
        .values({
          notebookId,
          userId,
          title: initialTitle,
          mode,
          model: modelId,
        })
        .returning();
      activeConversationId = newConv.id;
    }

    // Update notebook's remembered model
    await db
      .update(notebooks)
      .set({ lastModel: modelId })
      .where(eq(notebooks.id, notebookId))
      .catch(() => {});

    // 10. Fetch previous conversation history
    const pastMessages = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, activeConversationId))
      .orderBy(asc(messages.createdAt))
      .limit(20);

    // 11. Save current User Message to DB
    await db.insert(messages).values({
      conversationId: activeConversationId,
      role: 'user',
      content: message.trim(),
    });

    // 12. Create AI SDK Model Instance
    const aiModel = createProviderModel({
      provider: modelDef.provider,
      apiKey: keyInfo.apiKey,
      modelId: modelDef.id,
      customBaseUrl: keyInfo.customBaseUrl,
    });

    // Format chat history
    const chatHistory = [
      ...pastMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      {
        role: 'user' as const,
        content: message.trim(),
      },
    ];

    // 13. Trigger streaming with maxRetries: 2
    const result = streamText({
      model: aiModel,
      system: systemPrompt,
      messages: chatHistory,
      maxRetries: 2,
      async onFinish({ text }) {
        if (!text?.trim()) return;

        try {
          // Save assistant response with citations
          await db.insert(messages).values({
            conversationId: activeConversationId!,
            role: 'assistant',
            content: text,
            citations: retrieval.citations,
          });

          // Update conversation title if this is the first turn
          if (pastMessages.length <= 1) {
            const cleanTitle = message
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
                .where(eq(conversations.id, activeConversationId!))
                .catch(() => {});
            }
          }

          // Auto-save key conversation context to notebook shared memory
          try {
            const memoryTitle = message.slice(0, 42).replace(/[*_#]/g, '').trim();
            const memoryContent = `Q: ${message.trim()}\nA: ${text.slice(0, 360).trim()}...`;
            await db.insert(notes).values({
              notebookId,
              userId,
              title: memoryTitle || 'Chat Context Takeaway',
              content: memoryContent,
            });
          } catch (memErr) {
            console.warn('Auto memory save warning:', memErr);
          }

          // Trigger background chunk backfill for any un-embedded chunks
          backfillChunkEmbeddings(notebookId, userId).catch(() => {});
        } catch (dbErr) {
          console.error('Error saving assistant message to DB:', dbErr);
        }
      },
    });

    // 14. Return Text Stream Response with custom Citations & Conversation ID headers
    return result.toTextStreamResponse({
      headers: {
        'X-Conversation-Id': activeConversationId,
        'X-Citations': encodeURIComponent(JSON.stringify(retrieval.citations)),
      },
    });
  } catch (error: any) {
    console.error('Chat endpoint error:', error);

    let errorMessage =
      error?.message ||
      'An unexpected error occurred while communicating with the AI model.';

    if (
      errorMessage.includes('high demand') ||
      errorMessage.includes('overloaded') ||
      errorMessage.includes('503') ||
      errorMessage.includes('429') ||
      errorMessage.includes('Failed after') ||
      errorMessage.includes('RESOURCE_EXHAUSTED')
    ) {
      errorMessage = 'The AI model is currently experiencing unusually high demand. Please try again in a few moments or switch to another model.';
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: error?.code || 'CHAT_ERROR',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
