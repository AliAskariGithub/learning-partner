'use server';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/db';
import { apiKeys, ApiKey } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import { ProviderId } from '@/lib/ai/providers';
import { testProviderKey } from '@/lib/ai/factory';
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
