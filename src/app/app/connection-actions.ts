'use server';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { connections, Connection } from '@/db/schema';
import { getSession } from '@/lib/auth/session';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto';
import {
  ProviderId,
  SafeConnection,
  ConnectionStatus,
  CallMode,
  ConnectionMethod,
} from '@/lib/connections/types';
import { getConnectionProvider } from '@/lib/connections/registry';
import { generatePkcePair, validateStateToken } from '@/lib/security/pkce';
import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';

/**
 * Returns all connections for the authenticated user, sanitized without secrets.
 */
export async function getUserConnections(): Promise<SafeConnection[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const rows = await db
    .select()
    .from(connections)
    .where(eq(connections.userId, session.user.id))
    .orderBy(desc(connections.isDefault), desc(connections.createdAt));

  return rows.map((r) => {
    const overrides = (r.modelCapabilityOverrides as any) || {};
    const configuredModel = overrides?.customModel || overrides?.modelName || null;
    const customModels = Array.isArray(overrides?.configuredModels)
      ? overrides.configuredModels
      : configuredModel
      ? [configuredModel]
      : [];

    return {
      id: r.id,
      provider: r.provider as ProviderId,
      method: r.method as ConnectionMethod,
      callMode: r.callMode as CallMode,
      baseUrl: r.baseUrl,
      status: r.status as ConnectionStatus,
      accessTokenExpiresAt: r.accessTokenExpiresAt ? r.accessTokenExpiresAt.toISOString() : null,
      grantedScopes: (r.grantedScopes as string[]) || null,
      accountLabel: r.accountLabel || `${r.provider.toUpperCase()} Connection`,
      configuredModel,
      customModels,
      lastError: r.lastError,
      lastUsedAt: r.lastUsedAt ? r.lastUsedAt.toISOString() : null,
      isDefault: r.isDefault,
      autoFallback: r.autoFallback,
      createdAt: r.createdAt.toISOString(),
    };
  });
}

/**
 * Validates and adds an API key or custom endpoint connection.
 */
export async function addApiKeyConnection(params: {
  provider: ProviderId;
  label?: string;
  key?: string;
  baseUrl?: string;
  callMode?: CallMode;
  modelName?: string;
  modelCapabilityOverrides?: Record<string, any>;
}): Promise<{ success: boolean; error?: string; connection?: SafeConnection }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const providerImpl = getConnectionProvider(params.provider);
  if (!providerImpl) {
    return { success: false, error: `Unsupported provider: ${params.provider}` };
  }

  const cleanKey = params.key?.trim() || '';
  const cleanUrl = params.baseUrl?.trim() || null;
  const cleanModel = params.modelName?.trim() || null;
  const callMode: CallMode = params.callMode || 'server';

  // 1. Validation
  if (providerImpl.validateCredentials && callMode === 'server') {
    const val = await providerImpl.validateCredentials({
      apiKey: cleanKey,
      customBaseUrl: cleanUrl,
    });
    if (!val.valid) {
      return { success: false, error: val.error || 'Failed to validate credentials.' };
    }
  }

  // 2. Encryption
  const encryptedKey = cleanKey ? encryptApiKey(cleanKey) : null;
  const keyLast4 = cleanKey ? cleanKey.slice(-4) : 'xxxx';
  
  let label = params.label?.trim();
  if (!label) {
    if (params.provider === 'custom') {
      label = `Custom Configuration (${cleanModel || 'custom-model'})`;
    } else if (params.provider === 'openrouter') {
      label = cleanModel ? `OpenRouter (${cleanModel})` : `OpenRouter (...${keyLast4})`;
    } else {
      label = cleanKey ? `${providerImpl.name} (...${keyLast4})` : `${providerImpl.name} (${callMode} mode)`;
    }
  }

  const overrides = {
    ...(params.modelCapabilityOverrides || {}),
    ...(cleanModel ? { customModel: cleanModel, configuredModels: [cleanModel] } : {}),
  };

  const method: ConnectionMethod =
    params.provider === 'omniroute' || params.provider === 'custom' || cleanUrl
      ? 'custom_endpoint'
      : 'api_key';

  // 3. Insert connection
  const [created] = await db
    .insert(connections)
    .values({
      userId: session.user.id,
      provider: params.provider,
      method,
      callMode,
      baseUrl: cleanUrl,
      status: 'connected',
      encryptedAccessToken: encryptedKey,
      accountLabel: label,
      modelCapabilityOverrides: Object.keys(overrides).length > 0 ? (overrides as any) : null,
      isDefault: false,
      autoFallback: false,
    })
    .returning();

  revalidatePath('/settings');
  revalidatePath('/app', 'layout');

  return {
    success: true,
    connection: {
      id: created.id,
      provider: created.provider as ProviderId,
      method: created.method as ConnectionMethod,
      callMode: created.callMode as CallMode,
      baseUrl: created.baseUrl,
      status: created.status as ConnectionStatus,
      accessTokenExpiresAt: created.accessTokenExpiresAt
        ? created.accessTokenExpiresAt.toISOString()
        : null,
      grantedScopes: (created.grantedScopes as string[]) || null,
      accountLabel: created.accountLabel || `${created.provider.toUpperCase()} Connection`,
      configuredModel: cleanModel,
      customModels: cleanModel ? [cleanModel] : [],
      lastError: created.lastError,
      lastUsedAt: created.lastUsedAt ? created.lastUsedAt.toISOString() : null,
      isDefault: created.isDefault,
      autoFallback: created.autoFallback,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

/**
 * Immediately tests credentials before saving (for the "Test Connection" button).
 */
export async function testUnsavedCredentials(params: {
  provider: ProviderId;
  key?: string;
  baseUrl?: string;
  callMode?: CallMode;
  modelName?: string;
}): Promise<{ healthy: boolean; error?: string }> {
  const cleanKey = params.key?.trim() || '';
  const cleanUrl = params.baseUrl?.trim() || null;

  const providerImpl = getConnectionProvider(params.provider);
  if (!providerImpl) {
    return { healthy: false, error: `Unsupported provider: ${params.provider}` };
  }

  if (params.callMode === 'browser') {
    // Browser mode is tested in client DOM via direct fetch
    return { healthy: true };
  }

  if (providerImpl.validateCredentials) {
    const res = await providerImpl.validateCredentials({
      apiKey: cleanKey,
      customBaseUrl: cleanUrl,
    });
    return { healthy: res.valid, error: res.error };
  }

  return { healthy: true };
}

/**
 * Generates OAuth PKCE authorization URL and sets a secure, short-lived httpOnly cookie.
 */
export async function getOAuthAuthorizationUrl(
  providerId: 'chatgpt' | 'openrouter',
  returnUrl: string = '/app'
): Promise<{
  url?: string;
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: 'Unauthorized. Please sign in.' };
  }

  const providerImpl = getConnectionProvider(providerId);
  if (!providerImpl || !providerImpl.getAuthorizationUrl) {
    return { error: `OAuth is not supported for provider ${providerId}.` };
  }

  const headersList = await headers();
  const hostHeader = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1') ? 'http' : 'https');
  const appBase = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${hostHeader}`;
  const redirectUri = `${appBase.replace(/\/+$/, '')}/api/connections/oauth/${providerId}/callback`;

  const pkce = generatePkcePair();

  // Store state and verifier in httpOnly short-lived cookie (10 min)
  const cookieStore = await cookies();
  const oauthStatePayload = JSON.stringify({
    state: pkce.state,
    codeVerifier: pkce.codeVerifier,
    provider: providerId,
    userId: session.user.id,
    returnUrl,
  });

  const isLocal = hostHeader.includes('localhost') || hostHeader.includes('127.0.0.1');
  const isSecure = process.env.NODE_ENV === 'production' && !isLocal;

  cookieStore.set('lp_oauth_state', oauthStatePayload, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  try {
    const authUrl = await providerImpl.getAuthorizationUrl({
      state: pkce.state,
      codeChallenge: pkce.codeChallenge,
      redirectUri,
    });
    return { url: authUrl };
  } catch (err: any) {
    return { error: err.message || 'Failed to generate authorization URL.' };
  }
}

/**
 * Tests an existing connection by checking health against the provider.
 */
export async function testConnection(connectionId: string): Promise<{
  healthy: boolean;
  status: ConnectionStatus;
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [conn] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)))
    .limit(1);

  if (!conn) throw new Error('Connection not found.');

  const providerImpl = getConnectionProvider(conn.provider);
  if (!providerImpl) throw new Error(`Provider implementation missing for ${conn.provider}`);

  let plainToken = '';
  if (conn.encryptedAccessToken) {
    plainToken = decryptApiKey(conn.encryptedAccessToken);
  }

  const health = providerImpl.checkHealth
    ? await providerImpl.checkHealth(conn, plainToken)
    : { healthy: true, status: 'connected' as ConnectionStatus };

  await db
    .update(connections)
    .set({
      status: health.status,
      lastError: health.error || null,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(connections.id, connectionId));

  revalidatePath('/app');
  revalidatePath('/settings');

  return {
    healthy: health.healthy,
    status: health.status,
    error: health.error,
  };
}

/**
 * Disconnects and deletes a connection.
 * If provider supports token revocation, revokes refresh token before deletion.
 */
export async function disconnectConnection(connectionId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [conn] = await db
    .select()
    .from(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)))
    .limit(1);

  if (!conn) return { success: true };

  // Call provider revocation endpoint if refresh token exists
  const providerImpl = getConnectionProvider(conn.provider);
  if (providerImpl?.revoke && conn.encryptedRefreshToken) {
    try {
      const plainRefresh = decryptApiKey(conn.encryptedRefreshToken);
      await providerImpl.revoke({ token: plainRefresh, tokenTypeHint: 'refresh_token' });
    } catch (e) {
      console.warn('Revocation call failed before deletion:', e);
    }
  }

  await db
    .delete(connections)
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)));

  revalidatePath('/app');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Sets a connection as the user's default for its category.
 */
export async function setDefaultConnection(connectionId: string): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  // Clear isDefault on all other connections
  await db
    .update(connections)
    .set({ isDefault: false })
    .where(eq(connections.userId, session.user.id));

  // Mark target connection as default
  await db
    .update(connections)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)));

  revalidatePath('/app');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Toggles automatic fallback to Gemini Key for ChatGPT plan connections.
 */
export async function toggleAutoFallback(connectionId: string, enabled: boolean): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(connections)
    .set({ autoFallback: enabled, updatedAt: new Date() })
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)));

  revalidatePath('/app');
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Updates model capability overrides for custom / OmniRoute connections.
 */
export async function updateModelCapabilityOverrides(
  connectionId: string,
  overrides: Record<string, any>
): Promise<{ success: boolean }> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await db
    .update(connections)
    .set({ modelCapabilityOverrides: overrides, updatedAt: new Date() })
    .where(and(eq(connections.id, connectionId), eq(connections.userId, session.user.id)));

  revalidatePath('/app');
  revalidatePath('/settings');
  return { success: true };
}

