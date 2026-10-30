import { ConnectionProvider, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { MODEL_CATALOG, ModelDefinition } from '@/lib/ai/providers';

export const geminiProvider: ConnectionProvider = {
  id: 'gemini',
  name: 'Google Gemini',
  description: 'Official API key from Google AI Studio. Covers chat, embeddings, structured output, and TTS.',
  method: 'api_key',
  supportsOAuth: false,
  isPrimary: true,

  async validateCredentials({ apiKey }) {
    if (!apiKey?.trim()) {
      return { valid: false, error: 'API key cannot be empty.' };
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.error?.message || `Google returned status ${res.status}: ${res.statusText}`;
        if (res.status === 429) {
          return { valid: false, error: 'Free tier quota or rate limit exceeded. Please wait or check your Google AI Studio quota.' };
        }
        if (res.status === 400 || res.status === 403) {
          return { valid: false, error: 'Invalid API key or key lacks Gemini API access. Please check your key in Google AI Studio.' };
        }
        return { valid: false, error: message };
      }
      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        error: err.name === 'TimeoutError' ? 'Validation timed out after 10s.' : err.message || 'Network error',
      };
    }
  },

  async checkHealth(connection: Connection, plainToken: string): Promise<HealthCheckResult> {
    const val = await this.validateCredentials!({ apiKey: plainToken });
    if (val.valid) {
      return { healthy: true, status: 'connected' };
    }
    const isRateLimited = val.error?.includes('quota') || val.error?.includes('rate limit');
    return {
      healthy: false,
      status: isRateLimited ? 'capped_or_exhausted' : 'error',
      error: val.error,
      isUsageLimit: isRateLimited,
    };
  },

  async listModels(): Promise<ModelDefinition[]> {
    return MODEL_CATALOG.filter((m) => m.provider === 'google');
  },
};

