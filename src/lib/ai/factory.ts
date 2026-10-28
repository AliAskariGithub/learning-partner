import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { embed, LanguageModel } from 'ai';
import { ProviderId } from './providers';

export interface CreateModelParams {
  provider: ProviderId;
  apiKey: string;
  modelId: string;
  customBaseUrl?: string | null;
}

/**
 * Creates an AI SDK LanguageModel instance using the user's decrypted key.
 */
export function createProviderModel(params: CreateModelParams): LanguageModel {
  const { provider, apiKey, modelId, customBaseUrl } = params;

  switch (provider) {
    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai(modelId);
    }
    case 'anthropic': {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(modelId);
    }
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(modelId);
    }
    case 'groq': {
      const groq = createGroq({ apiKey });
      return groq(modelId);
    }
    case 'openrouter': {
      const openrouter = createOpenAI({
        name: 'openrouter',
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey,
      });
      return openrouter(modelId);
    }
    case 'custom': {
      const baseURL = customBaseUrl?.trim() || 'http://localhost:11434/v1';
      const custom = createOpenAI({
        name: 'custom',
        baseURL,
        apiKey: apiKey || 'not-needed',
      });
      return custom(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Validates a provider API key by making a lightweight test request.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export async function testProviderKey(params: {
  provider: ProviderId;
  apiKey: string;
  customBaseUrl?: string | null;
}): Promise<{ valid: boolean; error?: string }> {
  const { provider, apiKey, customBaseUrl } = params;

  try {
    switch (provider) {
      case 'openai': {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return {
            valid: false,
            error: body.error?.message || `OpenAI returned status ${res.status}: ${res.statusText}`,
          };
        }
        return { valid: true };
      }

      case 'anthropic': {
        const res = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'x-api-key': apiKey,
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
      }

      case 'google': {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          return {
            valid: false,
            error: body.error?.message || `Google returned status ${res.status}: ${res.statusText}`,
          };
        }
        return { valid: true };
      }

      case 'groq': {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
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
      }

      case 'openrouter': {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${apiKey}` },
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
      }

      case 'custom': {
        const baseURL = (customBaseUrl?.trim() || 'http://localhost:11434/v1').replace(/\/+$/, '');
        const res = await fetch(`${baseURL}/models`, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          return {
            valid: false,
            error: `Custom endpoint returned status ${res.status}: ${res.statusText}`,
          };
        }
        return { valid: true };
      }

      default:
        return { valid: false, error: `Unknown provider: ${provider}` };
    }
  } catch (err: any) {
    return {
      valid: false,
      error: err.name === 'TimeoutError' ? 'Connection timed out after 10s.' : err.message || 'Network error',
    };
  }
}

/**
 * Generates an embedding vector normalized to 1536 dimensions.
 * Currently supports OpenAI (text-embedding-3-small) and Google (text-embedding-004 padded/normalized).
 */
export async function generateEmbeddingVector(params: {
  provider: ProviderId;
  apiKey: string;
  text: string;
}): Promise<number[] | null> {
  const { provider, apiKey, text } = params;
  if (!text?.trim()) return null;

  try {
    if (provider === 'openai') {
      const openai = createOpenAI({ apiKey });
      const { embedding } = await embed({
        model: openai.textEmbeddingModel('text-embedding-3-small'),
        value: text.slice(0, 8000),
      });
      return embedding;
    }

    if (provider === 'google') {
      const google = createGoogleGenerativeAI({ apiKey });
      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-001'),
        value: text.slice(0, 8000),
      });
      // Normalize / adapt to 1536 dimensions for schema compatibility
      if (embedding.length === 1536) return embedding;
      if (embedding.length > 1536) {
        const sliced = embedding.slice(0, 1536);
        const norm = Math.sqrt(sliced.reduce((acc, v) => acc + v * v, 0)) || 1;
        return sliced.map((v) => v / norm);
      }
      const padded = new Array(1536).fill(0);
      for (let i = 0; i < embedding.length; i++) {
        padded[i] = embedding[i];
      }
      return padded;
    }

    return null;
  } catch (err) {
    console.error('Failed to generate embedding vector:', err);
    return null;
  }
}
