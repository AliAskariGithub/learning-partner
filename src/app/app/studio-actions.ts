'use server';

import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { outputs, StudioOutput, sources, sourceChunks, notebooks } from '@/db/schema';
import { requireUser } from '@/lib/auth/session';
import { getDecryptedKeyForProvider } from './api-key-actions';
import { getModelDefinition, ProviderId } from '@/lib/ai/providers';
import { createProviderModel } from '@/lib/ai/factory';
import { assembleStudioPrompt, StudioPromptParams } from '@/lib/ai/prompts';
import { synthesizeVoiceScript } from '@/lib/ai/tts';
import { generateText } from 'ai';
import { revalidatePath } from 'next/cache';
import { STORAGE_LIMITS } from '@/config/limits';
import { checkRateLimit } from '@/lib/ratelimit';

export interface GenerateStudioOutputParams {
  notebookId: string;
  type: 'quiz' | 'flashcards' | 'study_guide' | 'summary' | 'mind_map' | 'report' | 'voice';
  title?: string;
  sourceIds?: string[];
  modelId?: string;
  options: StudioPromptParams['options'] & {
    voiceProvider?: ProviderId | 'web_speech';
    speaker1Voice?: string;
    speaker2Voice?: string;
  };
}

/**
 * Fetches all outputs for a given notebook, scoped strictly by authenticated user.
 */
export async function getNotebookOutputs(notebookId: string): Promise<StudioOutput[]> {
  const user = await requireUser();

  const rows = await db
    .select()
    .from(outputs)
    .where(and(eq(outputs.notebookId, notebookId), eq(outputs.userId, user.id)))
    .orderBy(desc(outputs.createdAt));

  return rows;
}

/**
 * Generates a new Studio output item.
 */
export async function generateStudioOutput(
  params: GenerateStudioOutputParams
): Promise<{ success: boolean; outputId?: string; error?: string }> {
  try {
    const user = await requireUser();
    const { notebookId, type, options, title } = params;

    // Rate limiting check
    const rateLimit = checkRateLimit(user.id, 20, 60000);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: `Rate limit reached. Please wait ${rateLimit.retryAfter}s before generating another output.`,
      };
    }

    // Check existing count limit
    const existing = await db
      .select({ id: outputs.id })
      .from(outputs)
      .where(and(eq(outputs.notebookId, notebookId), eq(outputs.userId, user.id)));

    if (existing.length >= STORAGE_LIMITS.MAX_OUTPUTS_PER_NOTEBOOK) {
      return {
        success: false,
        error: `Maximum outputs limit (${STORAGE_LIMITS.MAX_OUTPUTS_PER_NOTEBOOK}) reached for this notebook.`,
      };
    }

    // Determine model to use
    const modelId = params.modelId || 'gemini-3.8-flash';
    const modelDef = getModelDefinition(modelId);

    // Retrieve active provider API key for text model
    let keyInfo = await getDecryptedKeyForProvider(user.id, modelDef.provider);

    // If no key found for selected provider, check if Google Gemini default is available
    if (!keyInfo && process.env.GOOGLE_GENERATIVE_AI_API_KEY && modelDef.provider === 'google') {
      keyInfo = {
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        customBaseUrl: null,
        keyId: 'env-default',
      };
    }

    if (!keyInfo) {
      return {
        success: false,
        error: `No active API key found for ${modelDef.provider}. Please add one in Settings or switch models.`,
      };
    }

    // Determine sources to use
    let targetSourceIds = params.sourceIds;
    if (!targetSourceIds || targetSourceIds.length === 0) {
      const activeSources = await db
        .select({ id: sources.id })
        .from(sources)
        .where(
          and(
            eq(sources.notebookId, notebookId),
            eq(sources.userId, user.id),
            eq(sources.enabled, true),
            eq(sources.status, 'ready')
          )
        );
      targetSourceIds = activeSources.map((s) => s.id);
    }

    if (targetSourceIds.length === 0) {
      return {
        success: false,
        error: 'No active sources selected. Please enable or upload at least one source document.',
      };
    }

    // Fetch chunks for the chosen sources to ground the generation
    const chunks = await db
      .select({
        id: sourceChunks.id,
        content: sourceChunks.content,
        pageNumber: sourceChunks.pageNumber,
        sourceId: sourceChunks.sourceId,
      })
      .from(sourceChunks)
      .where(
        and(
          inArray(sourceChunks.sourceId, targetSourceIds),
          eq(sourceChunks.userId, user.id)
        )
      )
      .limit(60);

    if (chunks.length === 0) {
      return {
        success: false,
        error: 'Selected sources have no processed content chunks. Please retry ingestion.',
      };
    }

    // Build grounded sources context string with numbered chunks [1], [2], ...
    const formattedContext = chunks
      .map((c, idx) => `[${idx + 1}] (Source ${c.sourceId}${c.pageNumber ? `, Page ${c.pageNumber}` : ''}):\n${c.content}`)
      .join('\n\n---\n\n');

    // Default title based on type
    const typeTitles: Record<string, string> = {
      quiz: 'Comprehensive Knowledge Quiz',
      flashcards: 'Active Recall Flashcards',
      study_guide: 'Complete Study Guide',
      summary: 'Executive Briefing Document',
      mind_map: 'Core Concepts Mind Map',
      report: 'Deep Synthesis Report',
      voice: 'Audio Overview Discussion',
    };
    const defaultTitle = title || typeTitles[type] || 'Studio Synthesis';

    // 1. Create initial output record with 'generating' status
    const [initialRow] = await db
      .insert(outputs)
      .values({
        notebookId,
        userId: user.id,
        type,
        title: defaultTitle,
        sourceIds: targetSourceIds,
        model: modelId,
        status: 'generating',
      })
      .returning();

    const outputId = initialRow.id;

    // Asynchronous / immediate generation pipeline
    try {
      const languageModel = createProviderModel({
        provider: modelDef.provider,
        apiKey: keyInfo.apiKey,
        modelId: modelDef.id,
        customBaseUrl: keyInfo.customBaseUrl,
      });

      const { systemPrompt, userPrompt } = assembleStudioPrompt({
        type,
        sourcesContext: formattedContext,
        options,
      });

      // Generate text with model
      let genResponse = await generateText({
        model: languageModel,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: type === 'quiz' || type === 'flashcards' || type === 'mind_map' ? 0.2 : 0.4,
      });

      let rawContent = genResponse.text.trim();

      // Clean markdown code fence if model wrapped raw JSON in ```json ... ```
      if (rawContent.startsWith('```json')) {
        rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
      } else if (rawContent.startsWith('```')) {
        rawContent = rawContent.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
      }

      // Handle specific types validation
      if (type === 'quiz' || type === 'flashcards' || type === 'mind_map') {
        // Validate JSON
        try {
          const parsed = JSON.parse(rawContent);
          const parsedTitle = parsed.title || defaultTitle;

          await db
            .update(outputs)
            .set({
              title: parsedTitle,
              content: rawContent,
              status: 'ready',
              updatedAt: new Date(),
            })
            .where(eq(outputs.id, outputId));
        } catch {
          // Retry once if JSON was malformed
          const retryResponse = await generateText({
            model: languageModel,
            system: `${systemPrompt}\nIMPORTANT: Your previous response was invalid JSON. Return ONLY the raw valid JSON payload. No explanations.`,
            prompt: userPrompt,
            temperature: 0.1,
          });
          let retryText = retryResponse.text.trim();
          if (retryText.startsWith('```json')) {
            retryText = retryText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
          } else if (retryText.startsWith('```')) {
            retryText = retryText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
          }

          const parsed = JSON.parse(retryText);
          await db
            .update(outputs)
            .set({
              title: parsed.title || defaultTitle,
              content: retryText,
              status: 'ready',
              updatedAt: new Date(),
            })
            .where(eq(outputs.id, outputId));
        }
      } else if (type === 'voice') {
        // Voice Overview Pipeline
        // Step 1: Parse and validate script as array of { speaker, text }
        let script: Array<{ speaker: string; text: string }> = [];
        try {
          script = JSON.parse(rawContent);
          if (!Array.isArray(script)) throw new Error('Script is not an array.');
        } catch {
          // Retry script generation once
          const retryScript = await generateText({
            model: languageModel,
            system: `${systemPrompt}\nCRITICAL: Return ONLY a valid JSON array of objects with schema: [{ "speaker": "Alex", "text": "..." }]. No code blocks.`,
            prompt: userPrompt,
            temperature: 0.2,
          });
          let retryText = retryScript.text.trim();
          if (retryText.startsWith('```json')) {
            retryText = retryText.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
          } else if (retryText.startsWith('```')) {
            retryText = retryText.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
          }
          script = JSON.parse(retryText);
        }

        // Enforce max turns limit
        if (script.length > STORAGE_LIMITS.VOICE_LIMITS.MAX_SCRIPT_TURNS) {
          script = script.slice(0, STORAGE_LIMITS.VOICE_LIMITS.MAX_SCRIPT_TURNS);
        }

        const voiceProvider = options.voiceProvider || 'web_speech';
        let voiceApiKey = '';

        if (voiceProvider !== 'web_speech') {
          const ttsKeyInfo = await getDecryptedKeyForProvider(user.id, voiceProvider);
          if (ttsKeyInfo) {
            voiceApiKey = ttsKeyInfo.apiKey;
          } else if (voiceProvider === 'google' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
            voiceApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
          }
        }

        // Voice config
        const voiceConfig = {
          speaker1Name: options.voiceStyle === 'narration' ? 'Narrator' : 'Alex',
          speaker2Name: options.voiceStyle === 'narration' ? '' : 'Jordan',
          speaker1Voice: options.speaker1Voice || (voiceProvider === 'google' ? 'Puck' : 'alloy'),
          speaker2Voice: options.speaker2Voice || (voiceProvider === 'google' ? 'Kore' : 'echo'),
          style: options.voiceStyle || 'conversation',
          format: options.voiceFormat || 'deep_dive',
          provider: voiceProvider,
        };

        // Step 2 & 3: Audio synthesis & storage
        const synthResult = await synthesizeVoiceScript({
          provider: voiceProvider,
          apiKey: voiceApiKey,
          turns: script,
          voiceConfig,
        });

        await db
          .update(outputs)
          .set({
            title: defaultTitle,
            content: JSON.stringify(script),
            script,
            audioKeys: synthResult.audioKeys,
            durationSeconds: synthResult.totalDurationSeconds,
            voiceConfig,
            status: 'ready',
            updatedAt: new Date(),
          })
          .where(eq(outputs.id, outputId));
      } else {
        // Study Guide, Summary, Report (Markdown content)
        // Extract title if present in first line (# Title)
        const titleMatch = rawContent.match(/^#\s+(.+)$/m);
        const resolvedTitle = titleMatch ? titleMatch[1].replace(/[*_#]/g, '').trim() : defaultTitle;

        await db
          .update(outputs)
          .set({
            title: resolvedTitle,
            content: rawContent,
            status: 'ready',
            updatedAt: new Date(),
          })
          .where(eq(outputs.id, outputId));
      }

      revalidatePath('/app');
      return { success: true, outputId };
    } catch (err: any) {
      console.error('Studio generation failed:', err);
      await db
        .update(outputs)
        .set({
          status: 'failed',
          errorMessage: err.message || 'Generation failed. Please try again.',
          updatedAt: new Date(),
        })
        .where(eq(outputs.id, outputId));

      return {
        success: false,
        outputId,
        error: err.message || 'Generation failed.',
      };
    }
  } catch (outerErr: any) {
    return { success: false, error: outerErr.message || 'Internal server error.' };
  }
}

/**
 * Renames a generated studio output.
 */
export async function renameStudioOutput(
  outputId: string,
  newTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      return { success: false, error: 'Title cannot be empty.' };
    }

    await db
      .update(outputs)
      .set({ title: cleanTitle, updatedAt: new Date() })
      .where(and(eq(outputs.id, outputId), eq(outputs.userId, user.id)));

    revalidatePath('/app');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to rename output.' };
  }
}

/**
 * Deletes a studio output and associated audio storage segments.
 */
export async function deleteStudioOutput(
  outputId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const [row] = await db
      .select()
      .from(outputs)
      .where(and(eq(outputs.id, outputId), eq(outputs.userId, user.id)));

    if (!row) {
      return { success: false, error: 'Output not found or access denied.' };
    }

    // Delete output record
    await db.delete(outputs).where(eq(outputs.id, outputId));

    revalidatePath('/app');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to delete output.' };
  }
}

/**
 * Regenerates an existing studio output using its current settings.
 */
export async function regenerateStudioOutput(
  outputId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const [row] = await db
      .select()
      .from(outputs)
      .where(and(eq(outputs.id, outputId), eq(outputs.userId, user.id)));

    if (!row) {
      return { success: false, error: 'Output not found.' };
    }

    return generateStudioOutput({
      notebookId: row.notebookId,
      type: row.type as any,
      title: row.title,
      sourceIds: (row.sourceIds as string[]) || undefined,
      modelId: row.model,
      options: {
        voiceStyle: (row.voiceConfig as any)?.style,
        voiceFormat: (row.voiceConfig as any)?.format,
        voiceProvider: (row.voiceConfig as any)?.provider,
        speaker1Voice: (row.voiceConfig as any)?.speaker1Voice,
        speaker2Voice: (row.voiceConfig as any)?.speaker2Voice,
      },
    });
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to regenerate output.' };
  }
}
