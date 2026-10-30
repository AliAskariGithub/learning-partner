import { ConnectionProvider, CallbackResult, RefreshResult, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { MODEL_CATALOG, ModelDefinition } from '@/lib/ai/providers';

export function isPlanUsageEnabled(): boolean {
  return process.env.OPENAI_PLAN_USAGE_ENABLED === 'true';
}

export const CHATGPT_REQUIRED_SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'chatgpt.tokens.use.direct',
  'resource.invoke',
];

export const chatgptProvider: ConnectionProvider = {
  id: 'chatgpt',
  name: 'Sign in with ChatGPT',
  description: 'Connect your ChatGPT Plus or Pro subscription to draw inference from your plan allowance.',
  method: 'oauth_plan',
  supportsOAuth: true,
  isPrimary: true,

  getAuthorizationUrl({ state, codeChallenge, redirectUri }) {
    const clientId = process.env.OPENAI_OAUTH_CLIENT_ID || '';
    if (!clientId) {
      throw new Error('OPENAI_OAUTH_CLIENT_ID is not configured in server environment.');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: CHATGPT_REQUIRED_SCOPES.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `https://auth.openai.com/api/accounts/authorize?${params.toString()}`;
  },

  async handleCallback({ code, codeVerifier, redirectUri }): Promise<CallbackResult> {
    const clientId = process.env.OPENAI_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.OPENAI_OAUTH_CLIENT_SECRET || '';

    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });

    if (clientSecret) {
      bodyParams.set('client_secret', clientSecret);
    }

    const res = await fetch('https://auth.openai.com/api/accounts/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.error_description || errBody.error || `Token exchange failed (${res.status})`;
      throw new Error(`OpenAI OAuth Error: ${msg}`);
    }

    const data = await res.json();
    const rawScope = data.scope || '';
    const grantedScopes: string[] = rawScope.split(/\s+/).filter(Boolean);

    // Verify whether plan-usage scope was granted
    const hasPlanScope = grantedScopes.includes('chatgpt.tokens.use.direct');

    let accountLabel = 'ChatGPT Subscriber';
    try {
      if (data.access_token) {
        const userRes = await fetch('https://auth.openai.com/api/accounts/oauth/userinfo', {
          headers: { Authorization: `Bearer ${data.access_token}` },
          signal: AbortSignal.timeout(5000),
        });
        if (userRes.ok) {
          const u = await userRes.json();
          if (u.email) accountLabel = `ChatGPT (${u.email})`;
        }
      }
    } catch {
      // non-blocking fallback
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in || 3600,
      grantedScopes,
      accountLabel,
      status: hasPlanScope ? 'connected' : 'not_eligible',
      lastError: hasPlanScope
        ? undefined
        : 'The required plan usage scope (chatgpt.tokens.use.direct) was not granted. A ChatGPT Plus or Pro subscription is required.',
    };
  },

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const clientId = process.env.OPENAI_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.OPENAI_OAUTH_CLIENT_SECRET || '';

    const bodyParams = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      refresh_token: refreshToken,
    });

    if (clientSecret) {
      bodyParams.set('client_secret', clientSecret);
    }

    const res = await fetch('https://auth.openai.com/api/accounts/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: bodyParams.toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`Refresh failed: ${errBody.error_description || errBody.error || res.statusText}`);
    }

    const data = await res.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // rotate on use if provided
      expiresIn: data.expires_in || 3600,
    };
  },

  async revoke({ token, tokenTypeHint = 'refresh_token' }) {
    const clientId = process.env.OPENAI_OAUTH_CLIENT_ID || '';
    const clientSecret = process.env.OPENAI_OAUTH_CLIENT_SECRET || '';

    const bodyParams = new URLSearchParams({
      token,
      token_type_hint: tokenTypeHint,
      client_id: clientId,
    });
    if (clientSecret) {
      bodyParams.set('client_secret', clientSecret);
    }

    try {
      await fetch('https://auth.openai.com/api/accounts/oauth/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
        signal: AbortSignal.timeout(10000),
      });
    } catch (e) {
      console.warn('OpenAI token revocation warning:', e);
    }
  },

  async checkHealth(connection: Connection, plainToken: string): Promise<HealthCheckResult> {
    if (connection.status === 'not_eligible') {
      return {
        healthy: false,
        status: 'not_eligible',
        error: 'ChatGPT Plus or Pro subscription is required to draw direct tokens.',
      };
    }

    try {
      // Test endpoint using model list or lightweight probe
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${plainToken}` },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        return { healthy: true, status: 'connected' };
      }

      if (res.status === 429) {
        return {
          healthy: false,
          status: 'capped_or_exhausted',
          error: 'Your ChatGPT subscription plan allowance or weekly app cap has been reached. Check your ChatGPT usage settings.',
          isUsageLimit: true,
        };
      }

      if (res.status === 403) {
        return {
          healthy: false,
          status: 'not_eligible',
          error: 'Account is not eligible for direct plan token usage.',
        };
      }

      if (res.status === 401) {
        return {
          healthy: false,
          status: 'expired',
          error: 'Access token expired or unauthorized.',
        };
      }

      return {
        healthy: false,
        status: 'error',
        error: `OpenAI returned status ${res.status}: ${res.statusText}`,
      };
    } catch (err: any) {
      return {
        healthy: false,
        status: 'error',
        error: err.message || 'Health probe failed',
      };
    }
  },

  async listModels(): Promise<ModelDefinition[]> {
    // Only return models supported by ChatGPT Plan usage (e.g. gpt-4o, o3-mini) with plan capability restrictions
    return MODEL_CATALOG.filter((m) => m.provider === 'openai').map((m) => ({
      ...m,
      capabilities: {
        ...m.capabilities,
        // Plan funded requests require streaming and have storage disabled
        embeddings: false,
      },
    }));
  },
};

