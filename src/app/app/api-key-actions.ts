'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { apiKeys, ApiKey } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { ProviderId } from '@/lib/ai/providers';
import { testProviderKey, createProviderModel } from '@/lib/ai/factory';
import { PROVIDER_REGISTRY, MODEL_CATALOG } from '@/lib/ai/providers';
import { generateText } from 'ai';
import { revalidatePath } from 'next/cache';

export interface SafeApiKey {
  id: string;
  provider: ProviderId;
  label: string;
  keyLast4: string;
  customBaseUrl?: string | null;
  status: 'active' | 'invalid' | 'rate_limited';
  createdAt: string;
  lastUsedAt?: string | null;
}

/**
 * Lists the authenticated user's API keys (without encrypted secret).
 */
export async function getUserApiKeys(): Promise<SafeApiKey[]> {
  const session = await getSession();
  if (!session?.user?.id) {
    return [];
  }

  const rows = await db
    .select({
      id: apiKeys.id,
      provider: apiKeys.provider,
      label: apiKeys.label,
      keyLast4: apiKeys.keyLast4,
      customBaseUrl: apiKeys.customBaseUrl,
      status: apiKeys.status,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id))
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((r) => ({
    ...r,
    provider: r.provider as ProviderId,
    createdAt: r.createdAt.toISOString(),
    lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
  }));
}

/**
 * Validates and adds a new encrypted API key for the authenticated user.
 */
export async function addApiKey(params: {
  provider: ProviderId;
  label: string;
  key: string;
  customBaseUrl?: string;
}): Promise<{ success: boolean; error?: string; key?: SafeApiKey }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const cleanKey = params.key.trim();
  if (!cleanKey) {
    return { success: false, error: 'API key cannot be empty.' };
  }

  // 1. Validate key with lightweight test request
  const testRes = await testProviderKey({
    provider: params.provider,
    apiKey: cleanKey,
    customBaseUrl: params.customBaseUrl,
  });

  if (!testRes.valid) {
    return {
      success: false,
      error: testRes.error || 'Failed to validate API key with provider.',
    };
  }

  // 2. Encrypt key with AES-256-GCM
  const encrypted = encryptApiKey(cleanKey);
  const keyLast4 = cleanKey.slice(-4) || 'xxxx';
  const label = params.label?.trim() || `${params.provider.toUpperCase()} Key (...${keyLast4})`;

  // 3. Insert into database
  const [created] = await db
    .insert(apiKeys)
    .values({
      userId: session.user.id,
      provider: params.provider,
      label,
      encryptedKey: encrypted,
      keyLast4,
      customBaseUrl: params.customBaseUrl?.trim() || null,
      status: 'active',
    })
    .returning();

  revalidatePath('/settings');
  revalidatePath('/app');

  return {
    success: true,
    key: {
      id: created.id,
      provider: created.provider as ProviderId,
      label: created.label,
      keyLast4: created.keyLast4,
      customBaseUrl: created.customBaseUrl,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      lastUsedAt: null,
    },
  };
}

/**
 * Renames an existing API key.
 */
export async function updateApiKeyLabel(keyId: string, newLabel: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const label = newLabel.trim();
  if (!label) throw new Error('Label cannot be empty');

  await db
    .update(apiKeys)
    .set({ label })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)));

  revalidatePath('/settings');
  revalidatePath('/app');
  return { success: true };
}

/**
 * Deletes an API key.
 */
export async function deleteApiKey(keyId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)));

  revalidatePath('/settings');
  revalidatePath('/app');
  return { success: true };
}

/**
 * Tests an existing API key and updates its status.
 */
export async function testExistingKey(keyId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [row] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, session.user.id)))
    .limit(1);

  if (!row) throw new Error('API key not found');

  const decrypted = decryptApiKey(row.encryptedKey);
  const testRes = await testProviderKey({
    provider: row.provider as ProviderId,
    apiKey: decrypted,
    customBaseUrl: row.customBaseUrl,
  });

  const newStatus = testRes.valid ? 'active' : 'invalid';
  await db
    .update(apiKeys)
    .set({
      status: newStatus,
      lastUsedAt: new Date(),
    })
    .where(eq(apiKeys.id, keyId));

  revalidatePath('/settings');
  revalidatePath('/app');

  return {
    valid: testRes.valid,
    error: testRes.error,
    status: newStatus,
  };
}

/**
 * Server-only helper: Decrypts and retrieves the active API key for a specific provider.
 * Never exposed to client bundles.
 */
export async function getDecryptedKeyForProvider(
  userId: string,
  provider: ProviderId
): Promise<{ apiKey: string; customBaseUrl?: string | null; keyId: string } | null> {
  const [row] = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, userId),
        eq(apiKeys.provider, provider),
        eq(apiKeys.status, 'active')
      )
    )
    .orderBy(desc(apiKeys.createdAt))
    .limit(1);

  if (!row) return null;

  try {
    const plain = decryptApiKey(row.encryptedKey);
    // Update lastUsedAt asynchronously
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, row.id))
      .catch(() => {});

    return {
      apiKey: plain,
      customBaseUrl: row.customBaseUrl,
      keyId: row.id,
    };
  } catch (err) {
    console.error('Failed to decrypt user API key:', err);
    return null;
  }
}

export interface TestedModelInfo {
  id: string;
  name: string;
  provider: ProviderId;
  status: 'working' | 'quota_exceeded' | 'unavailable';
  statusDetails?: string;
  contextWindow: number;
  capabilities: {
    text: boolean;
    vision: boolean;
    audioInput: boolean;
    audioOutput: boolean;
    structuredOutput: boolean;
  };
}

/**
 * Fetches available models from the provider for the given key and pings them to check working status.
 */
export async function discoverAndTestModels(params: {
  provider: ProviderId;
  apiKey?: string;
  keyId?: string;
  customBaseUrl?: string | null;
}): Promise<{
  success: boolean;
  error?: string;
  models: TestedModelInfo[];
  usageUrl?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized', models: [] };
  }

  let plainKey = params.apiKey?.trim();
  let customBaseUrl = params.customBaseUrl;
  let provider = params.provider;

  if (params.keyId) {
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, params.keyId), eq(apiKeys.userId, session.user.id)))
      .limit(1);

    if (!row) {
      return { success: false, error: 'API key not found', models: [] };
    }
    plainKey = decryptApiKey(row.encryptedKey);
    provider = row.provider as ProviderId;
    customBaseUrl = row.customBaseUrl;
  }

  if (!plainKey) {
    return { success: false, error: 'API key is required', models: [] };
  }

  const providerMeta = PROVIDER_REGISTRY[provider];
  const usageUrl = providerMeta?.usageUrl || '';

  try {
    let candidateList: Array<{ id: string; name: string; contextWindow: number }> = [];

    if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(plainKey)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          success: false,
          error: body.error?.message || `Google returned status ${res.status}: ${res.statusText}`,
          models: [],
          usageUrl,
        };
      }
      const data = await res.json();
      const rawGoogleModels = (data.models || []).map((m: any) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name.replace('models/', ''),
        contextWindow: m.inputTokenLimit || 1048576,
      }));

      // Candidate models in preference order
      const priorityIds = [
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3-flash-preview',
        'gemini-1.5-pro',
      ];

      for (const pId of priorityIds) {
        const found = rawGoogleModels.find((m: any) => m.id === pId);
        if (found) {
          candidateList.push(found);
        } else {
          const cat = MODEL_CATALOG.find((m) => m.id === pId);
          if (cat) {
            candidateList.push({ id: cat.id, name: cat.name, contextWindow: cat.capabilities.contextWindow });
          }
        }
      }
    } else if (provider === 'openai') {
      candidateList = [
        { id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextWindow: 128000 },
        { id: 'o1', name: 'OpenAI o1', contextWindow: 200000 },
        { id: 'o3-mini', name: 'OpenAI o3-mini', contextWindow: 200000 },
      ];
    } else if (provider === 'anthropic') {
      candidateList = [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextWindow: 200000 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextWindow: 200000 },
        { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', contextWindow: 200000 },
      ];
    } else if (provider === 'groq') {
      candidateList = [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', contextWindow: 128000 },
        { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', contextWindow: 128000 },
      ];
    } else if (provider === 'openrouter') {
      candidateList = [
        { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', contextWindow: 128000 },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', contextWindow: 200000 },
      ];
    } else {
      candidateList = [{ id: 'default', name: 'Default Model', contextWindow: 32000 }];
    }

    // Ping test candidate models in parallel (with timeout)
    const testedResults = await Promise.allSettled(
      candidateList.map(async (cand) => {
        const catDef = MODEL_CATALOG.find((m) => m.id === cand.id);
        const capabilities = catDef
          ? catDef.capabilities
          : {
              text: true,
              vision: cand.id.includes('flash') || cand.id.includes('4o') || cand.id.includes('sonnet'),
              audioInput: cand.id.includes('3.8') || cand.id.includes('3.7') || cand.id.includes('3.5') || cand.id.includes('4o'),
              audioOutput: cand.id.includes('3.8') || cand.id.includes('3.5') || cand.id.includes('4o'),
              structuredOutput: true,
              toolUse: true,
              embeddings: false,
              contextWindow: cand.contextWindow,
            };

        try {
          const model = createProviderModel({
            provider,
            apiKey: plainKey!,
            modelId: cand.id,
            customBaseUrl,
          });

          await generateText({
            model,
            prompt: 'hi',
            maxRetries: 0,
            abortSignal: AbortSignal.timeout(5000),
          });

          return {
            id: cand.id,
            name: cand.name,
            provider,
            status: 'working' as const,
            statusDetails: 'Online & Verified',
            contextWindow: cand.contextWindow,
            capabilities,
          };
        } catch (err: any) {
          const msg = err.message || '';
          if (
            msg.includes('Quota exceeded') ||
            msg.includes('limit: 20') ||
            msg.toLowerCase().includes('quota') ||
            msg.includes('RESOURCE_EXHAUSTED')
          ) {
            return {
              id: cand.id,
              name: cand.name,
              provider,
              status: 'quota_exceeded' as const,
              statusDetails: 'Daily free-tier quota limit reached (Check Usage)',
              contextWindow: cand.contextWindow,
              capabilities,
            };
          }

          if (msg.includes('high demand') || msg.includes('503') || msg.includes('429')) {
            return {
              id: cand.id,
              name: cand.name,
              provider,
              status: 'quota_exceeded' as const,
              statusDetails: 'Temporary demand spike',
              contextWindow: cand.contextWindow,
              capabilities,
            };
          }

          return {
            id: cand.id,
            name: cand.name,
            provider,
            status: 'unavailable' as const,
            statusDetails: msg.slice(0, 80) || 'Model not available on this tier',
            contextWindow: cand.contextWindow,
            capabilities,
          };
        }
      })
    );

    const models: TestedModelInfo[] = testedResults.map((r, idx) => {
      if (r.status === 'fulfilled') return r.value;
      const cand = candidateList[idx];
      return {
        id: cand.id,
        name: cand.name,
        provider,
        status: 'unavailable' as const,
        statusDetails: 'Failed check',
        contextWindow: cand.contextWindow,
        capabilities: {
          text: true,
          vision: false,
          audioInput: false,
          audioOutput: false,
          structuredOutput: true,
        },
      };
    });

    return {
      success: true,
      models,
      usageUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to discover models',
      models: [],
      usageUrl,
    };
  }
}
