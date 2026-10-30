export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'groq'
  | 'custom';

export interface ModelCapabilities {
  text: boolean;
  vision: boolean;
  audioInput: boolean;
  audioOutput: boolean;
  structuredOutput: boolean;
  toolUse: boolean;
  embeddings: boolean;
  contextWindow: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  provider: ProviderId;
  capabilities: ModelCapabilities;
  description?: string;
  isDefault?: boolean;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  badge: string;
  keyFormatHint: string;
  keyPlaceholder: string;
  keyUrl: string;
  usageUrl: string;
  docsUrl: string;
  description: string;
  defaultModel: string;
  supportsEmbeddings: boolean;
}

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderMeta> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT-4o & o-series',
    keyFormatHint: 'sk-proj-... or sk-...',
    keyPlaceholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxx',
    keyUrl: 'https://platform.openai.com/api-keys',
    usageUrl: 'https://platform.openai.com/usage',
    docsUrl: 'https://platform.openai.com/docs',
    description: 'Industry-standard models with vision, voice, structured outputs, and embeddings.',
    defaultModel: 'gpt-4o',
    supportsEmbeddings: true,
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Claude 3.5 & 3.7',
    keyFormatHint: 'sk-ant-api03-...',
    keyPlaceholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    usageUrl: 'https://console.anthropic.com/settings/cost',
    docsUrl: 'https://docs.anthropic.com',
    description: 'Exceptional reasoning, writing, coding, and large 200k context windows.',
    defaultModel: 'claude-3-5-sonnet-20241022',
    supportsEmbeddings: false,
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    badge: 'Gemini 3.8 & 3.7',
    keyFormatHint: 'AIzaSy...',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxx',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    usageUrl: 'https://ai.dev/rate-limit',
    docsUrl: 'https://ai.google.dev/docs',
    description: 'Massive 1M-2M token context, multimodal audio/vision, fast streaming, and free tier.',
    defaultModel: 'gemini-3.8-flash',
    supportsEmbeddings: true,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Unified Router',
    keyFormatHint: 'sk-or-v1-...',
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxx',
    keyUrl: 'https://openrouter.ai/keys',
    usageUrl: 'https://openrouter.ai/activity',
    docsUrl: 'https://openrouter.ai/docs',
    description: 'Access hundreds of models from OpenAI, Anthropic, Meta, DeepSeek, and Mistral.',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    supportsEmbeddings: false,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    badge: 'Ultra-Fast LPU',
    keyFormatHint: 'gsk_...',
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxx',
    keyUrl: 'https://console.groq.com/keys',
    usageUrl: 'https://console.groq.com/usage',
    docsUrl: 'https://console.groq.com/docs',
    description: 'Sub-second inference for open-weights models like Llama 3.3.',
    defaultModel: 'llama-3.3-70b-versatile',
    supportsEmbeddings: false,
  },
  custom: {
    id: 'custom',
    name: 'Custom Configuration',
    badge: 'OpenAI-Compatible',
    keyFormatHint: 'Any API key string or "not-needed"',
    keyPlaceholder: 'your-api-key',
    keyUrl: '',
    usageUrl: '',
    docsUrl: '',
    description: 'Connect any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM, Together, LocalAI).',
    defaultModel: 'custom-model',
    supportsEmbeddings: false,
  },
};

export const MODEL_CATALOG: ModelDefinition[] = [
  // Google Gemini
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'google',
    isDefault: true,
    description: 'Latest Google flagship: sub-second streaming, 1M context, vision, voice & structured output.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: true,
      audioOutput: true,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 1048576,
    },
  },
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'google',
    description: 'High-speed reasoning model with native multimodal capabilities and 1M context.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: true,
      audioOutput: true,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 1048576,
    },
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
    description: 'High-availability multimodal workhorse with 1M context and fast inference.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: true,
      audioOutput: true,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 1048576,
    },
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    provider: 'google',
    description: 'Ultra-fast lightweight model ideal for rapid summarization and high throughput.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 1048576,
    },
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Complex reasoning across lengthy documents and source materials (2M context).',
    capabilities: {
      text: true,
      vision: true,
      audioInput: true,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 2097152,
    },
  },

  // Anthropic Claude
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    isDefault: true,
    description: 'Industry-leading benchmark for deep analysis, synthesis, and nuanced writing.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 200000,
    },
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: 'Hybrid reasoning model with extended thinking capabilities.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 200000,
    },
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude model for rapid responses and summarization.',
    capabilities: {
      text: true,
      vision: false,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 200000,
    },
  },

  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    isDefault: true,
    description: 'Flagship multimodal model with native voice, vision, and structured output.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: true,
      audioOutput: true,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 128000,
    },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast, cost-efficient model for quick grounded retrieval and citations.',
    capabilities: {
      text: true,
      vision: true,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: true,
      contextWindow: 128000,
    },
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    description: 'Deep reasoning model optimized for STEM, analysis, and logic.',
    capabilities: {
      text: true,
      vision: false,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 200000,
    },
  },

  // OpenRouter
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B (OpenRouter)',
    provider: 'openrouter',
    isDefault: true,
    description: 'High performance open weights hosted via OpenRouter.',
    capabilities: {
      text: true,
      vision: false,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 131072,
    },
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 (OpenRouter)',
    provider: 'openrouter',
    description: 'Remarkable open weights model with strong comprehension and reasoning.',
    capabilities: {
      text: true,
      vision: false,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 65536,
    },
  },

  // Custom / OpenAI-compatible
  {
    id: 'custom-model',
    name: 'Custom Endpoint Model',
    provider: 'custom',
    isDefault: true,
    description: 'Configured via your custom OpenAI-compatible base URL.',
    capabilities: {
      text: true,
      vision: false,
      audioInput: false,
      audioOutput: false,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 32768,
    },
  },
];

export interface TtsVoiceInfo {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  tone: string;
  provider: ProviderId | 'web_speech';
}

export const TTS_VOICE_CATALOG: Record<string, TtsVoiceInfo[]> = {
  google: [
    { id: 'Puck', name: 'Puck', gender: 'male', tone: 'Energetic, youthful & conversational', provider: 'google' },
    { id: 'Charon', name: 'Charon', gender: 'male', tone: 'Deep, resonant & authoritative', provider: 'google' },
    { id: 'Kore', name: 'Kore', gender: 'female', tone: 'Warm, clear & empathetic', provider: 'google' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'male', tone: 'Bold, dynamic & academic', provider: 'google' },
    { id: 'Aoede', name: 'Aoede', gender: 'female', tone: 'Bright, articulate & engaging', provider: 'google' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'neutral', tone: 'Calm, balanced & neutral', provider: 'google' },
    { id: 'Leda', name: 'Leda', gender: 'female', tone: 'Expressive, friendly & conversational', provider: 'google' },
    { id: 'Orus', name: 'Orus', gender: 'male', tone: 'Scholarly, steady & grounded', provider: 'google' },
  ],
  openai: [
    { id: 'alloy', name: 'Alloy', gender: 'neutral', tone: 'Neutral, balanced & clear', provider: 'openai' },
    { id: 'echo', name: 'Echo', gender: 'male', tone: 'Warm, rounded & natural', provider: 'openai' },
    { id: 'fable', name: 'Fable', gender: 'male', tone: 'Expressive, accented & engaging', provider: 'openai' },
    { id: 'onyx', name: 'Onyx', gender: 'male', tone: 'Deep, authoritative & confident', provider: 'openai' },
    { id: 'nova', name: 'Nova', gender: 'female', tone: 'Energetic, articulate & friendly', provider: 'openai' },
    { id: 'shimmer', name: 'Shimmer', gender: 'female', tone: 'Gentle, clear & melodic', provider: 'openai' },
  ],
  web_speech: [
    { id: 'system_default_1', name: 'Host 1 (Browser System Voice)', gender: 'neutral', tone: 'Built-in browser speech', provider: 'web_speech' },
    { id: 'system_default_2', name: 'Host 2 (Browser System Voice)', gender: 'female', tone: 'Built-in browser speech', provider: 'web_speech' },
  ],
};

export function providerSupportsTts(provider: ProviderId | 'web_speech'): boolean {
  return provider === 'google' || provider === 'openai' || provider === 'web_speech';
}

export function getVoicesForProvider(provider: ProviderId | 'web_speech'): TtsVoiceInfo[] {
  return TTS_VOICE_CATALOG[provider] || TTS_VOICE_CATALOG.google;
}

/**
 * Finds capability metadata for any model ID, falling back to a safe default.
 */
export function getModelDefinition(modelId: string): ModelDefinition {
  const found = MODEL_CATALOG.find((m) => m.id === modelId);
  if (found) return found;

  // Infer provider from prefix if possible
  let provider: ProviderId = 'custom';
  if (modelId.startsWith('gemini')) provider = 'google';
  else if (modelId.startsWith('claude')) provider = 'anthropic';
  else if (modelId.startsWith('gpt') || modelId.startsWith('o1') || modelId.startsWith('o3')) provider = 'openai';
  else if (
    modelId.startsWith('deepseek/') ||
    modelId.startsWith('meta-llama/') ||
    modelId.startsWith('mistralai/') ||
    modelId.startsWith('qwen/') ||
    modelId.startsWith('openrouter/')
  ) {
    provider = 'openrouter';
  } else {
    provider = 'custom';
  }

  const isGeminiOrOpenAi = provider === 'google' || provider === 'openai';

  return {
    id: modelId,
    name: modelId,
    provider,
    capabilities: {
      text: true,
      vision: modelId.includes('vision') || modelId.includes('4o') || modelId.includes('gemini'),
      audioInput: modelId.includes('4o') || modelId.includes('gemini'),
      audioOutput: isGeminiOrOpenAi,
      structuredOutput: true,
      toolUse: true,
      embeddings: false,
      contextWindow: 32768,
    },
  };
}


