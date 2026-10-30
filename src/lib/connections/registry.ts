import { ProviderId, ConnectionProvider } from './types';
import { geminiProvider } from './providers/gemini';
import { chatgptProvider } from './providers/chatgpt';
import { openrouterProvider } from './providers/openrouter';
import { anthropicProvider } from './providers/anthropic';
import { openaiProvider } from './providers/openai';
import { groqProvider } from './providers/groq';
import { omnirouteProvider } from './providers/omniroute';
import { customProvider } from './providers/custom';

export const CONNECTION_PROVIDERS: Record<ProviderId, ConnectionProvider> = {
  gemini: geminiProvider,
  chatgpt: chatgptProvider,
  anthropic: anthropicProvider,
  openai: openaiProvider,
  openrouter: openrouterProvider,
  groq: groqProvider,
  omniroute: omnirouteProvider,
  custom: customProvider,
};

export function getConnectionProvider(providerId: string): ConnectionProvider | null {
  const normalized = providerId.toLowerCase();
  if (normalized === 'google') return CONNECTION_PROVIDERS.gemini;
  return (CONNECTION_PROVIDERS as Record<string, ConnectionProvider>)[normalized] || null;
}

