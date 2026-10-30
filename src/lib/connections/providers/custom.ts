import { ConnectionProvider, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { ModelDefinition } from '@/lib/ai/providers';
import { ssrfSafeFetch } from '@/lib/security/ssrf';

export const customProvider: ConnectionProvider = {
  id: 'custom',
  name: 'Custom Endpoint',
  description: 'Connect any OpenAI-compatible server (Ollama, LM Studio, vLLM, LocalAI) in server or browser mode.',
  method: 'custom_endpoint',
  supportsOAuth: false,
  isPrimary: false,

  async validateCredentials({ apiKey, customBaseUrl }) {
    const rawUrl = (customBaseUrl?.trim() || 'http://localhost:11434/v1').replace(/\/+$/, '');
    const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    if (isLocal && process.env.NODE_ENV === 'production') {
      return { valid: true };
    }

    try {
      const res = await ssrfSafeFetch(
        `${rawUrl}/models`,
        {
          headers: apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {},
        },
        { allowLocalInDev: true, timeoutMs: 8000 }
      );

      if (!res.ok) {
        return {
          valid: false,
          error: `Endpoint returned HTTP ${res.status}: ${res.statusText}`,
        };
      }
      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        error: `Could not reach endpoint: ${err.message}`,
      };
    }
  },

  async checkHealth(connection: Connection, plainToken: string): Promise<HealthCheckResult> {
    if (connection.callMode === 'browser') {
      return { healthy: true, status: 'connected' };
    }

    const val = await this.validateCredentials!({
      apiKey: plainToken,
      customBaseUrl: connection.baseUrl,
    });

    return {
      healthy: val.valid,
      status: val.valid ? 'connected' : 'error',
      error: val.error,
    };
  },

  async listModels(connection: Connection, plainToken: string): Promise<ModelDefinition[]> {
    const rawUrl = (connection.baseUrl?.trim() || 'http://localhost:11434/v1').replace(/\/+$/, '');
    const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    if (connection.callMode === 'browser' || (isLocal && process.env.NODE_ENV === 'production')) {
      return [
        {
          id: 'custom-model',
          name: 'Local Custom Model',
          provider: 'custom',
          isDefault: true,
          capabilities: {
            text: true,
            vision: false,
            audioInput: false,
            audioOutput: false,
            structuredOutput: false,
            toolUse: true,
            embeddings: false,
            contextWindow: 32768,
          },
        },
      ];
    }

    try {
      const res = await ssrfSafeFetch(
        `${rawUrl}/models`,
        {
          headers: plainToken ? { Authorization: `Bearer ${plainToken.trim()}` } : {},
        },
        { allowLocalInDev: true, timeoutMs: 8000 }
      );

      if (res.ok) {
        const json = await res.json();
        const dataList: Array<{ id: string }> = Array.isArray(json?.data) ? json.data : [];
        if (dataList.length > 0) {
          const overrides = (connection.modelCapabilityOverrides as Record<string, any>) || {};
          return dataList.map((m, idx) => {
            const ov = overrides[m.id] || {};
            return {
              id: m.id,
              name: m.id,
              provider: 'custom',
              isDefault: idx === 0,
              capabilities: {
                text: true,
                vision: Boolean(ov.vision),
                audioInput: Boolean(ov.audioInput),
                audioOutput: Boolean(ov.audioOutput),
                structuredOutput: Boolean(ov.structuredOutput),
                toolUse: true,
                embeddings: Boolean(ov.embeddings),
                contextWindow: ov.contextWindow || 32768,
              },
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to discover custom models:', e);
    }

    return [
      {
        id: 'custom-model',
        name: 'Custom Endpoint Model',
        provider: 'custom',
        isDefault: true,
        capabilities: {
          text: true,
          vision: false,
          audioInput: false,
          audioOutput: false,
          structuredOutput: false,
          toolUse: true,
          embeddings: false,
          contextWindow: 32768,
        },
      },
    ];
  },
};

