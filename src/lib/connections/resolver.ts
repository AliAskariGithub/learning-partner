import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { connections, Connection } from '@/db/schema';
import { ProviderId, ResolvedCredentials } from './types';
import { getConnectionProvider } from './registry';
import { decryptApiKey, encryptApiKey } from '@/lib/crypto';
import { getModelDefinition } from '@/lib/ai/providers';

// In-memory mutex map to serialize token refreshes per connection ID
const refreshMutexMap = new Map<string, Promise<string>>();

/**
 * Normalizes provider ID across legacy 'google' and phase 5 'gemini'.
 */
export function normalizeProviderId(provider: string): ProviderId {
  const p = provider.toLowerCase();
  if (p === 'google') return 'gemini';
  return p as ProviderId;
}

/**
 * Single Unified Resolver: getCredentialsForRequest(userId, modelId)
 * Used by Chat, Studio, and Voice generation.
 * Handles token refreshes with per-connection serialization and opt-in fallback to Gemini.
 */
export async function getCredentialsForRequest(
  userId: string,
  modelId: string
): Promise<ResolvedCredentials | null> {
  if (!userId) return null;

  // 1. Fetch user's active connections, ordered by default flag and newest
  const userConns = await db
    .select()
    .from(connections)
    .where(
      and(
        eq(connections.userId, userId),
        eq(connections.status, 'connected')
      )
    )
    .orderBy(desc(connections.isDefault), desc(connections.createdAt));

  // A. Check if user has an active connection specifically configured for this model ID
  const modelSpecificConn = userConns.find((c) => {
    const overrides = (c.modelCapabilityOverrides as any) || {};
    if (overrides.customModel && overrides.customModel.toLowerCase() === modelId.toLowerCase()) {
      return true;
    }
    if (Array.isArray(overrides.configuredModels) && overrides.configuredModels.some((m: string) => m.toLowerCase() === modelId.toLowerCase())) {
      return true;
    }
    if (c.accountLabel && c.accountLabel.toLowerCase().includes(modelId.toLowerCase())) {
      return true;
    }
    return false;
  });

  let conn = modelSpecificConn || null;

  const modelDef = getModelDefinition(modelId);
  const targetProvider = normalizeProviderId(modelDef.provider);

  // B. If not specifically matched by model, match by targetProvider
  if (!conn) {
    conn = userConns.find((c) => c.provider === targetProvider) || null;

    // Cross-check: If target is custom or openrouter, and no exact match, use available custom/omniroute/openrouter
    if (!conn && (targetProvider === 'custom' || targetProvider === 'openrouter')) {
      conn = userConns.find((c) => c.provider === 'custom' || c.provider === 'omniroute' || c.provider === 'openrouter') || null;
    }
  }

  // Check if connection is ChatGPT and capped_or_exhausted with autoFallback enabled
  if (conn && conn.provider === 'chatgpt' && conn.status === 'capped_or_exhausted') {
    if (conn.autoFallback) {
      // Opt-in automatic fallback to Gemini Key
      const [geminiConn] = await db
        .select()
        .from(connections)
        .where(
          and(
            eq(connections.userId, userId),
            eq(connections.provider, 'gemini'),
            eq(connections.status, 'connected')
          )
        )
        .orderBy(desc(connections.createdAt))
        .limit(1);

      if (geminiConn) {
        conn = geminiConn;
      }
    }
  }

  // If still no user connection in DB, check if server environment Google API key is available
  if (!conn && targetProvider === 'gemini' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      connectionId: 'env-default',
      provider: 'gemini',
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      customBaseUrl: null,
      callMode: 'server',
      isPlanFunded: false,
    };
  }

  if (!conn) return null;

  // Handle browser mode connections (keys stored client-side in IndexedDB)
  if (conn.callMode === 'browser') {
    return {
      connectionId: conn.id,
      provider: conn.provider as ProviderId,
      apiKey: 'browser-mode',
      customBaseUrl: conn.baseUrl,
      callMode: 'browser',
      isPlanFunded: false,
      modelCapabilityOverrides: (conn.modelCapabilityOverrides as any) || {},
    };
  }

  // 2. Token Refresh handling (for OAuth plan / key connections)
  let plainToken = '';
  if (conn.encryptedAccessToken) {
    plainToken = decryptApiKey(conn.encryptedAccessToken);
  }

  const providerImpl = getConnectionProvider(conn.provider);

  // Check if token has expired or is expiring soon (within 5 minutes)
  const isExpiredOrSoon =
    conn.accessTokenExpiresAt &&
    conn.accessTokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpiredOrSoon && conn.encryptedRefreshToken && providerImpl?.refresh) {
    // Serialize refreshes per connectionId to prevent race conditions & token reuse errors
    const currentRefreshPromise = refreshMutexMap.get(conn.id);
    if (currentRefreshPromise) {
      plainToken = await currentRefreshPromise;
    } else {
      const refreshExecution = (async () => {
        try {
          const plainRefresh = decryptApiKey(conn.encryptedRefreshToken!);
          const refreshed = await providerImpl.refresh!(plainRefresh);

          const newEncryptedAccess = encryptApiKey(refreshed.accessToken);
          const newEncryptedRefresh = refreshed.refreshToken
            ? encryptApiKey(refreshed.refreshToken)
            : conn.encryptedRefreshToken;

          const newExpiresAt = refreshed.expiresIn
            ? new Date(Date.now() + refreshed.expiresIn * 1000)
            : null;

          await db
            .update(connections)
            .set({
              encryptedAccessToken: newEncryptedAccess,
              encryptedRefreshToken: newEncryptedRefresh,
              accessTokenExpiresAt: newExpiresAt,
              status: 'connected',
              lastError: null,
              updatedAt: new Date(),
            })
            .where(eq(connections.id, conn.id));

          return refreshed.accessToken;
        } catch (err: any) {
          console.error(`Failed to refresh connection token for ${conn.provider}:`, err);
          await db
            .update(connections)
            .set({
              status: 'revoked',
              lastError: `Token refresh failed: ${err.message}`,
              updatedAt: new Date(),
            })
            .where(eq(connections.id, conn.id));
          throw err;
        } finally {
          refreshMutexMap.delete(conn.id);
        }
      })();

      refreshMutexMap.set(conn.id, refreshExecution);
      plainToken = await refreshExecution;
    }
  }

  // Update lastUsedAt asynchronously
  db.update(connections)
    .set({ lastUsedAt: new Date() })
    .where(eq(connections.id, conn.id))
    .catch(() => {});

  return {
    connectionId: conn.id,
    provider: conn.provider as ProviderId,
    apiKey: plainToken,
    customBaseUrl: conn.baseUrl,
    callMode: conn.callMode as 'server' | 'browser',
    isPlanFunded: conn.method === 'oauth_plan',
    modelCapabilityOverrides: (conn.modelCapabilityOverrides as any) || {},
  };
}

/**
 * Backward compatibility helper for existing callers of getDecryptedKeyForProvider.
 */
export async function getDecryptedKeyForProvider(
  userId: string,
  provider: string
): Promise<{ apiKey: string; customBaseUrl?: string | null; keyId: string } | null> {
  const norm = normalizeProviderId(provider);
  const creds = await getCredentialsForRequest(userId, norm === 'gemini' ? 'gemini-3.8-flash' : norm);
  if (!creds || !creds.apiKey) return null;
  return {
    apiKey: creds.apiKey,
    customBaseUrl: creds.customBaseUrl,
    keyId: creds.connectionId,
  };
}

