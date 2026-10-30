import { ConnectionProvider, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { MODEL_CATALOG, ModelDefinition } from '@/lib/ai/providers';

export const anthropicProvider: ConnectionProvider = {
  id: 'anthropic',
  name: 'Anthropic Claude',
  description: 'Use an Anthropic API key. Claude subscriptions (Free, Pro, Max) can\'t be used in other apps.',
  method: 'api_key',
  supportsOAuth: false,
  isPrimary: false,

  async validateCredentials({ apiKey }) {
    if (!apiKey?.trim()) return { valid: false, error: 'API key cannot be empty.' };

    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          valid: false,
          error: body.error?.message || `Anthropic returned status ${res.status}: ${res.statusText}`,
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
    return MODEL_CATALOG.filter((m) => m.provider === 'anthropic');
  },
};

