import { ConnectionProvider, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { MODEL_CATALOG, ModelDefinition } from '@/lib/ai/providers';

export const groqProvider: ConnectionProvider = {
  id: 'groq',
  name: 'Groq',
  description: 'Ultra-fast LPU inference for open weights models like Llama 3.3 and Mixtral.',
  method: 'api_key',
  supportsOAuth: false,
  isPrimary: false,

  async validateCredentials({ apiKey }) {
    if (!apiKey?.trim()) return { valid: false, error: 'API key cannot be empty.' };

    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          valid: false,
          error: body.error?.message || `Groq returned status ${res.status}: ${res.statusText}`,
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
    return MODEL_CATALOG.filter((m) => m.provider === 'groq');
  },
};

