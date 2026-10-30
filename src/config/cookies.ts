export type CookieCategory = 'strictly_necessary' | 'preferences' | 'analytics';

export interface CookieDefinition {
  name: string;
  purpose: string;
  category: CookieCategory;
  duration: string;
  maxAgeSeconds?: number;
  isFirstParty: boolean;
  httpOnly: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
}

export interface CategoryInfo {
  id: CookieCategory;
  title: string;
  description: string;
  required: boolean;
  defaultEnabled: boolean;
}

export const COOKIE_POLICY_VERSION = 1;
export const COOKIE_POLICY_UPDATED_AT = '2026-10-30';

export const COOKIE_CATEGORIES: Record<CookieCategory, CategoryInfo> = {
  strictly_necessary: {
    id: 'strictly_necessary',
    title: 'Strictly Necessary',
    description:
      'Essential for the website to function securely. These handle user authentication sessions, CSRF security tokens, OAuth PKCE exchange states, and your cookie consent preference. They cannot be disabled.',
    required: true,
    defaultEnabled: true,
  },
  preferences: {
    id: 'preferences',
    title: 'Preferences & UI State',
    description:
      'Remembers your visual theme (dark or light), workspace panel layout sizes, interface language, audio playback speed, and UI dismissals. Stored locally on this device without tracking.',
    required: false,
    defaultEnabled: false,
  },
  analytics: {
    id: 'analytics',
    title: 'Analytics & Measurement',
    description:
      'Placeholder for privacy-respecting aggregate performance analytics. We currently do not set any analytics or advertising cookies.',
    required: false,
    defaultEnabled: false,
  },
};

export const COOKIE_REGISTRY: CookieDefinition[] = [
  // Strictly Necessary
  {
    name: 'neon_auth_session',
    purpose: 'Stores your encrypted cryptographic session for Neon Managed Auth sign-in.',
    category: 'strictly_necessary',
    duration: 'Session / 30 days',
    isFirstParty: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_consent',
    purpose: 'Records your cookie consent choices, policy version, and timestamp so we honor your privacy choices.',
    category: 'strictly_necessary',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_csrf',
    purpose: 'Cryptographic anti-forgery token protecting against Cross-Site Request Forgery attacks.',
    category: 'strictly_necessary',
    duration: 'Session',
    isFirstParty: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_oauth_state',
    purpose: 'Temporary cryptographic state and PKCE verifier for OAuth sign-in with ChatGPT and OpenRouter.',
    category: 'strictly_necessary',
    duration: '10 minutes',
    maxAgeSeconds: 600,
    isFirstParty: true,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  },

  // Preferences
  {
    name: 'lp_theme',
    purpose: 'Stores your visual appearance mode (dark or light theme) to prevent unstyled flashes on page load.',
    category: 'preferences',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_layout',
    purpose: 'Remembers workspace panel dimensions, collapsed sidebars, and active view preferences.',
    category: 'preferences',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_ui',
    purpose: 'Remembers UI toggles such as dismissed onboarding tips and expanded secondary AI provider panels.',
    category: 'preferences',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_voice',
    purpose: 'Remembers your audio overview preferences like playback speed and preferred narrator voice preview.',
    category: 'preferences',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
  {
    name: 'lp_lang',
    purpose: 'Remembers your chosen interface language (e.g. English, Urdu, Spanish, French).',
    category: 'preferences',
    duration: '180 days',
    maxAgeSeconds: 180 * 24 * 60 * 60,
    isFirstParty: true,
    httpOnly: false,
    sameSite: 'lax',
    secure: true,
  },
];

export interface ConsentRecord {
  version: number;
  timestamp: string;
  categories: {
    strictly_necessary: boolean;
    preferences: boolean;
    analytics: boolean;
  };
  gpcApplied?: boolean;
}

export const NON_ESSENTIAL_COOKIE_NAMES = COOKIE_REGISTRY.filter(
  (c) => c.category !== 'strictly_necessary'
).map((c) => c.name);

