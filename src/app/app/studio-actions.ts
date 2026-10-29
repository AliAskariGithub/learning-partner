'use server';

import { eq, and, desc, inArray, or, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { outputs, StudioOutput, sources, sourceChunks, notebooks } from '@/db/schema';
import { requireUser } from '@/lib/auth/session';
import { getDecryptedKeyForProvider } from './api-key-actions';
import { getModelDefinition, ProviderId, ModelCapabilities } from '@/lib/ai/providers';
import { createProviderModel } from '@/lib/ai/factory';
import { assembleStudioPrompt, StudioPromptParams } from '@/lib/ai/prompts';
import { synthesizeVoiceScript } from '@/lib/ai/tts';
import { generateText } from 'ai';
import { revalidatePath } from 'next/cache';
import { STORAGE_LIMITS } from '@/config/limits';
import { checkRateLimit } from '@/lib/ratelimit';

export interface GenerateStudioOutputParams {
  notebookId: string;
  conversationId?: string | null;
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
export async function getNotebookOutputs(
  notebookId: string,
  conversationId?: string | null
): Promise<StudioOutput[]> {
  const user = await requireUser();

  if (conversationId) {
    const rows = await db
      .select()
      .from(outputs)
      .where(
        and(
          eq(outputs.notebookId, notebookId),
          eq(outputs.userId, user.id),
          or(eq(outputs.conversationId, conversationId), isNull(outputs.conversationId))
        )
      )
      .orderBy(desc(outputs.createdAt));
    return rows;
  }

  const rows = await db
    .select()
    .from(outputs)
    .where(and(eq(outputs.notebookId, notebookId), eq(outputs.userId, user.id)))
    .orderBy(desc(outputs.createdAt));

  return rows;
}

/**
 * Executes text generation with an automated fallback cascade.
 * If the primary model encounters high demand / 503 / 429 / overload,
 * it retries with secondary high-availability models within the same provider family.
 */
async function generateTextWithFallback(params: {
  provider: ProviderId;
  apiKey: string;
  modelId: string;
  customBaseUrl?: string | null;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<string> {
  const { provider, apiKey, modelId, customBaseUrl, system, prompt, temperature = 0.3 } = params;

  // Start strictly with the user-selected model
  const candidateModels: string[] = [modelId];
  if (provider === 'google') {
    const googleFallbacks = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview'];
    for (const fb of googleFallbacks) {
      if (!candidateModels.includes(fb)) candidateModels.push(fb);
    }
  } else if (provider === 'openai') {
    const openaiFallbacks = ['gpt-4o', 'gpt-4o-mini'];
    for (const fb of openaiFallbacks) {
      if (!candidateModels.includes(fb)) candidateModels.push(fb);
    }
  } else if (provider === 'anthropic') {
    const anthropicFallbacks = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];
    for (const fb of anthropicFallbacks) {
      if (!candidateModels.includes(fb)) candidateModels.push(fb);
    }
  } else if (provider === 'groq') {
    const groqFallbacks = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
    for (const fb of groqFallbacks) {
      if (!candidateModels.includes(fb)) candidateModels.push(fb);
    }
  }

  let primaryError: any = null;
  let lastError: any = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const currentModelId = candidateModels[i];
    try {
      const languageModel = createProviderModel({
        provider,
        apiKey,
        modelId: currentModelId,
        customBaseUrl,
      });

      const res = await generateText({
        model: languageModel,
        system,
        prompt,
        temperature,
        maxRetries: 1,
      });

      if (res.text && res.text.trim()) {
        return res.text.trim();
      }
    } catch (err: any) {
      if (i === 0) {
        primaryError = err;
      }
      lastError = err;
      console.warn(`Model generation attempt with ${currentModelId} failed:`, err.message);
      if (i < candidateModels.length - 1) {
        await new Promise((r) => setTimeout(r, 800));
      }
    }
  }

  const errToReport = primaryError || lastError;
  const msg = errToReport?.message || '';

  if (msg.includes('Quota exceeded') || msg.includes('limit: 20') || msg.toLowerCase().includes('quota')) {
    throw new Error(
      `Daily API request quota exceeded for ${modelId}. Please switch models or try again later.`
    );
  }

  if (
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('Failed after') ||
    msg.includes('RESOURCE_EXHAUSTED')
  ) {
    throw new Error(
      `The selected AI model (${modelId}) is currently experiencing unusually high demand. We attempted multiple retries. Please wait a moment and click Regenerate.`
    );
  }

  throw errToReport || new Error(`Generation failed with ${modelId}.`);
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

    // Determine model to use from user selection
    const modelId = params.modelId || 'gemini-3.8-flash';
    const modelDef = getModelDefinition(modelId);

    // Capability check: Ensure the selected model supports this studio output type
    const requiredCapability: keyof ModelCapabilities =
      type === 'voice'
        ? 'audioOutput'
        : type === 'quiz' || type === 'flashcards' || type === 'mind_map'
        ? 'structuredOutput'
        : 'text';

    if (!modelDef.capabilities[requiredCapability]) {
      return {
        success: false,
        error: `The selected model (${modelDef.name}) does not support ${type.replace('_', ' ')} generation (requires ${requiredCapability} capability). Please choose a supported model in the model switcher.`,
      };
    }

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
        conversationId: params.conversationId || null,
        userId: user.id,
        type,
        title: defaultTitle,
        sourceIds: targetSourceIds,
        model: modelId,
        status: 'generating',
      })
      .returning();

    const outputId = initialRow.id;

    // Asynchronous / immediate generation pipeline with fallback
    try {
      const { systemPrompt, userPrompt } = assembleStudioPrompt({
        type,
        sourcesContext: formattedContext,
        options,
      });

      // Generate text with model fallback
      let rawContent = await generateTextWithFallback({
        provider: modelDef.provider,
        apiKey: keyInfo.apiKey,
        modelId: modelDef.id,
        customBaseUrl: keyInfo.customBaseUrl,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: type === 'quiz' || type === 'flashcards' || type === 'mind_map' ? 0.2 : 0.4,
      });

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
          let retryText = await generateTextWithFallback({
            provider: modelDef.provider,
            apiKey: keyInfo.apiKey,
            modelId: modelDef.id,
            customBaseUrl: keyInfo.customBaseUrl,
            system: `${systemPrompt}\nIMPORTANT: Your previous response was invalid JSON. Return ONLY the raw valid JSON payload. No explanations.`,
            prompt: userPrompt,
            temperature: 0.1,
          });

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
          let retryText = await generateTextWithFallback({
            provider: modelDef.provider,
            apiKey: keyInfo.apiKey,
            modelId: modelDef.id,
            customBaseUrl: keyInfo.customBaseUrl,
            system: `${systemPrompt}\nCRITICAL: Return ONLY a valid JSON array of objects with schema: [{ "speaker": "Alex", "text": "..." }]. No code blocks.`,
            prompt: userPrompt,
            temperature: 0.2,
          });

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
      const cleanError =
        err?.message?.includes('high demand') ||
        err?.message?.includes('overloaded') ||
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('Failed after')
          ? `${modelDef.name} is temporarily experiencing unusually high demand. Please wait a moment and click Regenerate.`
          : err?.message || 'Generation failed. Please try again.';

      await db
        .update(outputs)
        .set({
          status: 'failed',
          errorMessage: cleanError,
          updatedAt: new Date(),
        })
        .where(eq(outputs.id, outputId));

      return {
        success: false,
        outputId,
        error: cleanError,
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
  outputId: string,
  modelId?: string
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
      conversationId: row.conversationId,
      type: row.type as any,
      title: row.title,
      sourceIds: (row.sourceIds as string[]) || undefined,
      modelId: modelId || row.model || 'gemini-3.8-flash',
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
