export interface ProviderLinkConfig {
  id: string;
  name: string;
  badge?: string;
  keyUrl?: string;
  docsUrl: string;
  termsUrl?: string;
  pricingUrl?: string;
  helpText: string;
  freeTierNote?: string;
  privacyNotice?: string;
  keyFormatHint?: string;
  keyPlaceholder?: string;
}

export const PROVIDER_LINKS: Record<string, ProviderLinkConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Recommended',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    docsUrl: 'https://ai.google.dev/docs',
    termsUrl: 'https://ai.google.dev/gemini-api/terms',
    pricingUrl: 'https://ai.google.dev/pricing',
    helpText: 'Official API key from Google AI Studio. Covers chat, embeddings, structured outputs, and voice synthesis.',
    freeTierNote: 'Free tier includes generous RPM/TPM limits (up to 15 RPM / 1M TPM on Flash models).',
    privacyNotice:
      'On Google\'s free tier, Google may use submitted content to improve its products and machine learning models. Do not upload private or confidential study materials with a free-tier key; use a paid-tier key or another provider for sensitive documents.',
    keyFormatHint: 'Starts with AIzaSy...',
    keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxx',
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'Sign in with ChatGPT',
    badge: 'Requires Plus or Pro',
    docsUrl: 'https://help.openai.com/en/articles/6825453-chatgpt-plus',
    helpText: 'Connect your ChatGPT Plus or Pro subscription to fund reasoning models directly from your plan allowance.',
    privacyNotice:
      'Usage counts directly toward your personal ChatGPT plan allowance. You manage weekly caps and authorized tools in your ChatGPT Data Controls.',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com',
    helpText: 'Use an Anthropic API key. Claude subscriptions (Free, Pro, Max) can\'t be used in other apps.',
    keyFormatHint: 'Starts with sk-ant-api03-...',
    keyPlaceholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI API Key',
    keyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    helpText: 'Developer API key from the OpenAI Platform with support for GPT-4o, reasoning models, and embeddings.',
    keyFormatHint: 'Starts with sk-proj-... or sk-...',
    keyPlaceholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxx',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    keyUrl: 'https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/docs',
    helpText: 'Access hundreds of AI models from one unified router via API key or 1-click OAuth PKCE connection.',
    keyFormatHint: 'Starts with sk-or-v1-...',
    keyPlaceholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxx',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    keyUrl: 'https://console.groq.com/keys',
    docsUrl: 'https://console.groq.com/docs',
    helpText: 'Ultra-fast LPU inference for open weights models like Llama 3.3 and Mixtral.',
    keyFormatHint: 'Starts with gsk_...',
    keyPlaceholder: 'gsk_xxxxxxxxxxxxxxxxxxxxxxx',
  },
  omniroute: {
    id: 'omniroute',
    name: 'OmniRoute',
    docsUrl: 'https://github.com',
    helpText: 'Self-hosted AI gateway exposing OpenAI-compatible endpoints. Supports local browser mode and remote server mode.',
    keyPlaceholder: 'Optional gateway key',
  },
  custom: {
    id: 'custom',
    name: 'Custom Endpoint',
    docsUrl: 'https://platform.openai.com/docs/api-reference',
    helpText: 'Connect any OpenAI-compatible server (Ollama, LM Studio, vLLM, LocalAI) in server or browser mode.',
    keyPlaceholder: 'Optional endpoint key',
  },
};

