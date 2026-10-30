import { ConnectionProvider, CallbackResult, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { MODEL_CATALOG, ModelDefinition } from '@/lib/ai/providers';

export const openrouterProvider: ConnectionProvider = {
  id: 'openrouter',
  name: 'OpenRouter',
  description: 'Access hundreds of AI models via API key or 1-click OAuth PKCE authentication.',
  method: 'oauth_key',
  supportsOAuth: true,
  isPrimary: false,

  getAuthorizationUrl({ state, codeChallenge, redirectUri }) {
    const params = new URLSearchParams({
      callback_url: redirectUri,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    if (state) {
      params.set('state', state);
    }
    return `https://openrouter.ai/auth?${params.toString()}`;
  },

  async handleCallback({ code, codeVerifier }): Promise<CallbackResult> {
    const res = await fetch('https://openrouter.ai/api/v1/auth/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        code_verifier: codeVerifier,
        code_challenge_method: 'S256',
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenRouter Key Exchange Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const apiKey = data.key;
    if (!apiKey) {
      throw new Error('OpenRouter response did not contain an API key.');
    }

    const keyLast4 = apiKey.slice(-4) || 'xxxx';

    return {
      accessToken: apiKey,
      status: 'connected',
      accountLabel: `OpenRouter Key (...${keyLast4})`,
    };
  },

  async validateCredentials({ apiKey }) {
    if (!apiKey?.trim()) return { valid: false, error: 'API key cannot be empty.' };

    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          valid: false,
          error: body.error?.message || `OpenRouter returned status ${res.status}: ${res.statusText}`,
        };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Validation timed out' };
    }
  },

  async checkHealth(connection: Connection, plainToken: string): Promise<HealthCheckResult> {
    const val = await this.validateCredentials!({ apiKey: plainToken });
    return {
      healthy: val.valid,
      status: val.valid ? 'connected' : 'error',
      error: val.error,
    };
  },

  async listModels(): Promise<ModelDefinition[]> {
    return MODEL_CATALOG.filter((m) => m.provider === 'openrouter');
  },
};

