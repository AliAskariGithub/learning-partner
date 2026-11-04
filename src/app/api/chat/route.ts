import { NextRequest } from 'next/server';
import { eq, and, desc, asc } from 'drizzle-orm';
import { db } from '@/db';
import {
  notebooks,
  profiles,
  notes,
  conversations,
  messages,
  connections,
  outputs,
  ChatImageAttachment,
  ThoughtTimelineStep,
} from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { getModelDefinition, PROVIDER_REGISTRY } from '@/lib/ai/providers';
import { getCredentialsForRequest } from '@/lib/connections/resolver';
import { createProviderModel } from '@/lib/ai/factory';
import { retrieveNotebookContext, backfillChunkEmbeddings } from '@/lib/rag/retrieval';
import { ChatMode } from '@/lib/ai/prompts';
import { assembleContext } from '@/lib/ai/context';
import {
  getNotebookMemory,
  getNotebookMemoryItems,
  indexMessageChunk,
  searchPastConversationSnippets,
  consolidateNotebookMemory,
} from '@/lib/ai/memory';
import { isQuizIntent, QuizPayloadSchema, QuizPayload } from '@/lib/ai/quiz';
import { formatSSE } from '@/lib/streaming/protocol';
import { streamText, generateObject } from 'ai';
import fs from 'fs/promises';
import path from 'path';

export const maxDuration = 60; // Allow up to 60s for streaming pipeline

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

    // 2. Check rate limit (40 requests / min)
    const rateLimit = checkRateLimit(userId, 40, 60000);
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
      images = [],
    } = body as {
      notebookId: string;
      conversationId?: string | null;
      message: string;
      modelId?: string;
      mode?: ChatMode;
      images?: ChatImageAttachment[];
    };

    if (!notebookId || (!message?.trim() && images.length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Missing required notebookId or message content.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Resolve Model and verify capabilities
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

    // Capability check: Images in Learning mode require vision
    if (images.length > 0 && !modelDef.capabilities.vision) {
      return new Response(
        JSON.stringify({
          error: `The selected model (${modelDef.name}) cannot read images. Please choose a vision model (e.g. Gemini or Claude) or connect your Gemini key.`,
          code: 'CAPABILITY_UNSUPPORTED',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4b. Resolve credentials via single Phase 5 resolver
    const creds = await getCredentialsForRequest(userId, modelDef.id);

    if (!creds || !creds.apiKey) {
      const providerMeta = PROVIDER_REGISTRY[modelDef.provider];
      return new Response(
        JSON.stringify({
          error: `No active AI connection found for ${providerMeta?.name || modelDef.provider}. Please connect your Gemini key or ChatGPT account.`,
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

    // 6. Resolve Conversation
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
      const initialTitle = (message || 'Study Session').slice(0, 42).trim();
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

    // Update notebook's remembered model and mode
    await db
      .update(notebooks)
      .set({
        lastModel: modelId,
        lastMode: mode,
        updatedAt: new Date(),
      })
      .where(eq(notebooks.id, notebookId))
      .catch(() => { });

    // Save user message to database
    const [savedUserMsg] = await db
      .insert(messages)
      .values({
        conversationId: activeConversationId!,
        role: 'user',
        content: message.trim(),
        images: images.length > 0 ? images : null,
      })
      .returning();

    // Index user message for cross-chat hybrid retrieval
    indexMessageChunk({
      conversationId: activeConversationId!,
      messageId: savedUserMsg?.id,
      notebookId,
      userId,
      content: message.trim(),
    }).catch(() => { });

    // Fetch user profile for custom instructions
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.authUserId, userId))
      .limit(1);

    // Fetch Shared Notebook Memory & Durable Items
    const memory = await getNotebookMemory(notebookId, userId);
    const memoryItems = await getNotebookMemoryItems(notebookId, userId);
    const pinnedMemory = memoryItems.filter((m) => m.pinned);

    // Fetch Cross-Conversation Highlights
    const pastSnippets = await searchPastConversationSnippets({
      notebookId,
      userId,
      query: message,
      limit: 3,
    });

    // 7. Setup TransformStream for Typed SSE Delivery
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (event: any) => {
      try {
        await writer.write(encoder.encode(formatSSE(event)));
      } catch (e) {
        // stream may be closed by client abort
      }
    };

    // Execute streaming pipeline asynchronously
    (async () => {
      const startTime = Date.now();
      const timeline: ThoughtTimelineStep[] = [];

      try {
        // Emit Phase 1: Reading sources
        const p1Start = Date.now();
        await sendEvent({
          type: 'status',
          phase: 'Reading your sources',
          detail: 'Searching notebook source chunks...',
          timestamp: p1Start,
        });

        // 8. Hybrid RAG Retrieval over enabled sources
        const retrieval = await retrieveNotebookContext({
          notebookId,
          userId,
          query: message,
          maxTokens: Math.min(16000, Math.floor(modelDef.capabilities.contextWindow * 0.4)),
        });

        const p1End = Date.now();
        timeline.push({
          phase: 'Reading your sources',
          detail: `Retrieved ${retrieval.chunks.length} candidate passages`,
          elapsedMs: p1End - p1Start,
        });

        // Emit Phase 2: Finding relevant passages
        const p2Start = Date.now();
        await sendEvent({
          type: 'status',
          phase: 'Finding relevant passages',
          detail: `Synthesizing ${retrieval.citations.length} cited source chunks...`,
          timestamp: p2Start,
        });

        // Emit citations immediately
        if (retrieval.citations && retrieval.citations.length > 0) {
          await sendEvent({
            type: 'citations',
            citations: retrieval.citations,
          });
        }

        timeline.push({
          phase: 'Finding relevant passages',
          detail: `Selected ${retrieval.citations.length} grounded citations`,
          elapsedMs: Date.now() - p2Start,
        });

        // Fetch past conversation messages
        const pastMessages = await db
          .select({
            role: messages.role,
            content: messages.content,
          })
          .from(messages)
          .where(eq(messages.conversationId, activeConversationId!))
          .orderBy(asc(messages.createdAt))
          .limit(20);

        // 9. Assemble Context honoring strict priorities
        const assembled = assembleContext({
          mode,
          userCustomInstructions: profile?.customInstructions,
          notebookInstructions: notebook.instructions,
          memorySummary: notebook.useMemory ? memory?.summary : null,
          pinnedMemoryItems: notebook.useMemory ? pinnedMemory : [],
          retrievedSourceChunks: retrieval.chunks.map((c, idx) => ({
            chunkId: c.chunkId,
            sourceId: c.sourceId,
            sourceTitle: c.sourceTitle,
            content: c.content,
            citationNumber: idx + 1,
            pageNumber: c.pageNumber,
          })),
          pastConversationSnippets: pastSnippets,
          recentMessages: pastMessages.map((m) => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content,
          })),
          learningModeGrounding: notebook.learningModeGrounding || 'sources_first',
          preferredLanguage: profile?.preferredLanguage,
          maxTotalTokens: Math.min(24000, modelDef.capabilities.contextWindow - 2000),
        });

        // -------------------------------------------------------------
        // QUIZ MODE BRANCH: Strictly Generate Interactive Quizzes
        // -------------------------------------------------------------
        if (mode === 'quiz') {
          const quizIntent = isQuizIntent(message);

          if (!quizIntent.isQuiz) {
            // Friendly notice redirecting to Chat/Learning
            const notice = `💡 **Quiz Mode Only Creates Quizzes**\n\nQuiz mode is dedicated exclusively to active recall testing. If you would like to ask questions or discuss concepts, please switch to **Chat** or **Learning** mode.\n\n${quizIntent.suggestedTopic ? `Would you like to generate a quiz on: **"${quizIntent.suggestedTopic}"**?` : 'Type any topic or chapter title to create a quiz!'}`;

            await sendEvent({
              type: 'status',
              phase: 'Writing response',
            });
            await sendEvent({
              type: 'text_delta',
              delta: notice,
            });

            await db.insert(messages).values({
              conversationId: activeConversationId!,
              role: 'assistant',
              content: notice,
              citations: null,
            });

            await sendEvent({
              type: 'done',
              conversationId: activeConversationId!,
              title: 'Quiz Mode Guidance',
            });
            await writer.close();
            return;
          }

          // Generate structured quiz using AI model
          await sendEvent({
            type: 'status',
            phase: 'Generating quiz questions',
            detail: 'Formatting active recall assessment with citations...',
          });

          const aiModel = createProviderModel({
            provider: creds.provider === 'custom' ? 'custom' : modelDef.provider,
            apiKey: creds.apiKey,
            modelId: modelDef.id,
            customBaseUrl: creds.customBaseUrl,
          });

          let quizResult: QuizPayload;
          try {
            const { object } = await generateObject({
              model: aiModel,
              schema: QuizPayloadSchema,
              system: assembled.systemPrompt,
              prompt: `Generate an interactive quiz based on the user request and sources:\n"${message}"`,
            });
            quizResult = object;
          } catch (firstErr) {
            // Retry once on schema parsing failure
            console.warn('Quiz generation retry attempt:', firstErr);
            const { object } = await generateObject({
              model: aiModel,
              schema: QuizPayloadSchema,
              system: assembled.systemPrompt,
              prompt: `Generate an interactive quiz based on the user request and sources:\n"${message}"\nReturn strict valid JSON matching schema.`,
            });
            quizResult = object;
          }

          // Store quiz in outputs table as type 'quiz'
          const [savedQuizOutput] = await db
            .insert(outputs)
            .values({
              notebookId,
              conversationId: activeConversationId!,
              userId,
              type: 'quiz',
              title: quizResult.title,
              content: JSON.stringify(quizResult),
              model: modelDef.id,
              status: 'ready',
            })
            .returning();

          // Emit quiz data event to trigger QuizPlayView
          await sendEvent({
            type: 'quiz_data',
            quiz: quizResult,
          });

          const summaryText = `### 🎯 ${quizResult.title}\n\nI have created an interactive quiz with **${quizResult.questions.length} questions** based on your sources. Use the interactive player to test your knowledge!`;

          await sendEvent({
            type: 'text_delta',
            delta: summaryText,
          });

          await db.insert(messages).values({
            conversationId: activeConversationId!,
            role: 'assistant',
            content: summaryText,
            citations: retrieval.citations,
          });

          await sendEvent({
            type: 'done',
            conversationId: activeConversationId!,
            title: quizResult.title,
          });
          await writer.close();
          return;
        }

        // -------------------------------------------------------------
        // CHAT & LEARNING MODE BRANCH: Streaming Grounded Responses
        // -------------------------------------------------------------
        const p3Start = Date.now();
        await sendEvent({
          type: 'status',
          phase: 'Thinking',
          detail: 'Formulating grounded synthesis...',
          timestamp: p3Start,
        });

        // Resolve multimodal images into base64 data URLs if present
        let userMessageParts: any = message.trim();
        if (images.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: message.trim() || 'Please analyze this image based on our study sources.' }];
          for (const img of images) {
            let base64Url = img.url;
            if (img.storageKey && !img.url.startsWith('http')) {
              try {
                const localPath = path.resolve(process.cwd(), '.storage', 'uploads', img.storageKey);
                const buf = await fs.readFile(localPath);
                base64Url = `data:${img.mimeType || 'image/jpeg'};base64,${buf.toString('base64')}`;
              } catch (e) {
                console.warn('Could not read local image buffer:', e);
              }
            }
            contentParts.push({
              type: 'image',
              image: base64Url,
            });
          }
          userMessageParts = contentParts;
        }

        const modelMessages = [
          ...assembled.chatMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          {
            role: 'user' as const,
            content: userMessageParts,
          },
        ];

        const aiModel = createProviderModel({
          provider: creds.provider === 'custom' ? 'custom' : modelDef.provider,
          apiKey: creds.apiKey,
          modelId: modelDef.id,
          customBaseUrl: creds.customBaseUrl,
        });

        // Trigger streamText
        let accumulatedText = '';
        try {
          const textStream = streamText({
            model: aiModel,
            system: assembled.systemPrompt,
            messages: modelMessages,
            maxRetries: 2,
          });

          timeline.push({
            phase: 'Thinking',
            elapsedMs: Date.now() - p3Start,
          });

          await sendEvent({
            type: 'status',
            phase: 'Writing response',
            timestamp: Date.now(),
          });

          for await (const chunk of textStream.textStream) {
            accumulatedText += chunk;
            await sendEvent({
              type: 'text_delta',
              delta: chunk,
            });
          }
        } catch (initialErr: any) {
          console.warn('Initial model stream failed, attempting resilient fallback:', initialErr);
          if (modelDef.provider === 'google' || creds.provider === 'gemini') {
            const fallbackModelId = modelDef.id === 'gemini-3.8-flash' ? 'gemini-3.7-flash' : 'gemini-3.8-flash';
            const fallbackModel = createProviderModel({
              provider: 'google',
              apiKey: creds.apiKey,
              modelId: fallbackModelId,
              customBaseUrl: creds.customBaseUrl,
            });
            const fallbackStream = streamText({
              model: fallbackModel,
              system: assembled.systemPrompt,
              messages: modelMessages,
              maxRetries: 2,
            });

            for await (const chunk of fallbackStream.textStream) {
              accumulatedText += chunk;
              await sendEvent({
                type: 'text_delta',
                delta: chunk,
              });
            }
          } else {
            throw initialErr;
          }
        }

        timeline.push({
          phase: 'Writing response',
          elapsedMs: Date.now() - startTime,
        });

        // Save assistant message to DB
        const [savedAssistantMsg] = await db
          .insert(messages)
          .values({
            conversationId: activeConversationId!,
            role: 'assistant',
            content: accumulatedText,
            citations: retrieval.citations,
            thoughtTimeline: timeline,
          })
          .returning();

        // Index assistant message for retrieval
        indexMessageChunk({
          conversationId: activeConversationId!,
          messageId: savedAssistantMsg?.id,
          notebookId,
          userId,
          content: accumulatedText,
        }).catch(() => { });

        // Update conversation title if first exchange
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
              .catch(() => { });
          }
        }

        // Trigger background Memory Consolidation (debounced, non-blocking)
        if (notebook.useMemory) {
          consolidateNotebookMemory({
            notebookId,
            userId,
            conversationId: activeConversationId!,
            mode,
            recentMessages: [
              { id: 'u1', conversationId: activeConversationId!, role: 'user', content: message, citations: null, images: null, thoughtTimeline: null, reasoningSummary: null, createdAt: new Date() },
              { id: 'a1', conversationId: activeConversationId!, role: 'assistant', content: accumulatedText, citations: retrieval.citations, images: null, thoughtTimeline: null, reasoningSummary: null, createdAt: new Date() },
            ],
          }).then(() => {
            sendEvent({
              type: 'memory_updated',
              summary: 'Notebook memory consolidated with latest exchange',
              itemsCount: memoryItems.length,
            }).catch(() => { });
          }).catch(() => { });
        }

        // Trigger background embedding backfill
        backfillChunkEmbeddings(notebookId, userId).catch(() => { });

        // Emit done event
        await sendEvent({
          type: 'done',
          conversationId: activeConversationId!,
        });

        await writer.close();
      } catch (streamErr: any) {
        console.error('Streaming pipeline error:', streamErr);
        await sendEvent({
          type: 'error',
          error: streamErr?.message || 'Failed to stream response from AI model.',
        });
        await writer.close();
      }
    })();

    // Return text/event-stream response immediately
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Conversation-Id': activeConversationId || '',
      },
    });
  } catch (error: any) {
    console.error('Chat route top-level error:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Chat service encountered an error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
