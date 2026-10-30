import { ConnectionProvider, HealthCheckResult } from '../types';
import { Connection } from '@/db/schema';
import { ModelDefinition } from '@/lib/ai/providers';
import { ssrfSafeFetch } from '@/lib/security/ssrf';

export const omnirouteProvider: ConnectionProvider = {
  id: 'omniroute',
  name: 'OmniRoute Gateway',
  description: 'Self-hosted AI gateway exposing an OpenAI-compatible endpoint. Supports browser mode (localhost) and server mode (secure tunnel).',
  method: 'custom_endpoint',
  supportsOAuth: false,
  isPrimary: false,

  async validateCredentials({ apiKey, customBaseUrl }) {
    const rawUrl = (customBaseUrl?.trim() || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    // In local browser mode, server validation is skipped or checked if local allowed
    if (isLocal && process.env.NODE_ENV === 'production') {
      return {
        valid: true, // Marked valid for browser mode; browser will perform client-side probe
      };
    }

    try {
      const target = `${rawUrl}/models`;
      const res = await ssrfSafeFetch(
        target,
        {
          headers: apiKey ? { Authorization: `Bearer ${apiKey.trim()}` } : {},
        },
        { allowLocalInDev: true, timeoutMs: 8000 }
      );

      if (!res.ok) {
        return {
          valid: false,
          error: `OmniRoute endpoint returned HTTP ${res.status}: ${res.statusText}`,
        };
      }
      return { valid: true };
    } catch (err: any) {
      return {
        valid: false,
        error: `Could not reach OmniRoute: ${err.message}`,
      };
    }
  },

  async checkHealth(connection: Connection, plainToken: string): Promise<HealthCheckResult> {
    if (connection.callMode === 'browser') {
      return {
        healthy: true,
        status: 'connected',
      };
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
    const rawUrl = (connection.baseUrl?.trim() || 'http://localhost:20128/v1').replace(/\/+$/, '');
    const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');

    if (connection.callMode === 'browser' || (isLocal && process.env.NODE_ENV === 'production')) {
      return [
        {
          id: 'omniroute-default',
          name: 'OmniRoute Local Model',
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
      console.warn('Failed to discover OmniRoute models:', e);
    }

    return [
      {
        id: 'omniroute-default',
        name: 'OmniRoute Default Model',
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

