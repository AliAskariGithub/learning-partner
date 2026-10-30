import { Connection } from '@/db/schema';
import { ModelCapabilities, ModelDefinition } from '@/lib/ai/providers';

export type ProviderId =
  | 'gemini'
  | 'chatgpt'
  | 'anthropic'
  | 'openai'
  | 'openrouter'
  | 'groq'
  | 'omniroute'
  | 'custom';

export type ConnectionMethod = 'api_key' | 'oauth_plan' | 'oauth_key' | 'custom_endpoint';
export type CallMode = 'server' | 'browser';
export type ConnectionStatus =
  | 'connected'
  | 'capped_or_exhausted'
  | 'not_eligible'
  | 'expired'
  | 'revoked'
  | 'error';

export interface AuthorizationUrlParams {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}

export interface HandleCallbackParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface CallbackResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number; // seconds
  grantedScopes?: string[];
  accountLabel?: string;
  status?: ConnectionStatus;
  lastError?: string;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface HealthCheckResult {
  healthy: boolean;
  status: ConnectionStatus;
  error?: string;
  isUsageLimit?: boolean;
}

export interface ConnectionProvider {
  id: ProviderId;
  name: string;
  description: string;
  method: ConnectionMethod;
  supportsOAuth: boolean;
  isPrimary: boolean;

  getAuthorizationUrl?: (params: AuthorizationUrlParams) => Promise<string> | string;
  handleCallback?: (params: HandleCallbackParams) => Promise<CallbackResult>;
  refresh?: (refreshToken: string) => Promise<RefreshResult>;
  revoke?: (params: { token: string; tokenTypeHint?: 'access_token' | 'refresh_token' }) => Promise<void>;
  checkHealth?: (connection: Connection, plainToken: string) => Promise<HealthCheckResult>;
  listModels?: (connection: Connection, plainToken: string) => Promise<ModelDefinition[]>;
  validateCredentials?: (params: {
    apiKey: string;
    customBaseUrl?: string | null;
  }) => Promise<{ valid: boolean; error?: string }>;
}

export interface ResolvedCredentials {
  connectionId: string;
  provider: ProviderId;
  apiKey: string;
  customBaseUrl?: string | null;
  callMode: CallMode;
  isPlanFunded?: boolean;
  modelCapabilityOverrides?: Record<string, Partial<ModelCapabilities>>;
}

export interface SafeConnection {
  id: string;
  provider: ProviderId;
  method: ConnectionMethod;
  callMode: CallMode;
  baseUrl?: string | null;
  status: ConnectionStatus;
  accessTokenExpiresAt?: string | null;
  grantedScopes?: string[] | null;
  accountLabel: string;
  configuredModel?: string | null;
  customModels?: string[];
  lastError?: string | null;
  lastUsedAt?: string | null;
  isDefault: boolean;
  autoFallback: boolean;
  createdAt: string;
}
