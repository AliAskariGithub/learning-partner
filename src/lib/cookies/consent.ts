import {
  COOKIE_POLICY_VERSION,
  ConsentRecord,
  NON_ESSENTIAL_COOKIE_NAMES,
} from '@/config/cookies';

export const CONSENT_COOKIE_NAME = 'lp_consent';

/**
 * Parses the consent record from the raw lp_consent cookie string.
 * Returns null if missing or if the policy version has changed.
 */
export function parseConsentRecord(rawCookie?: string | null): ConsentRecord | null {
  if (!rawCookie) return null;
  try {
    const parsed = JSON.parse(rawCookie);
    if (parsed && typeof parsed === 'object') {
      // Re-prompt if policy version changed
      if (parsed.version !== COOKIE_POLICY_VERSION) {
        return null;
      }
      return {
        version: parsed.version,
        timestamp: parsed.timestamp || new Date().toISOString(),
        categories: {
          strictly_necessary: true,
          preferences: Boolean(parsed.categories?.preferences),
          analytics: Boolean(parsed.categories?.analytics),
        },
        gpcApplied: Boolean(parsed.gpcApplied),
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Checks if Global Privacy Control (GPC) is asserted.
 * Client-side: navigator.globalPrivacyControl === true
 * Server-side: Sec-GPC header === "1"
 */
export function isGpcSignalEnabled(secGpcHeader?: string | null): boolean {
  if (secGpcHeader === '1') return true;
  if (
    typeof navigator !== 'undefined' &&
    (navigator as any).globalPrivacyControl === true
  ) {
    return true;
  }
  return false;
}

/**
 * Client-Side: Writes a preference cookie only if preferences category has explicit consent.
 * Does nothing if consent is missing or rejected.
 */
export function setClientPreferenceCookie(name: string, value: string, days = 180): boolean {
  if (typeof document === 'undefined') return false;

  const currentConsent = getClientConsent();
  if (!currentConsent?.categories.preferences) {
    // Silently no-op when consent is missing
    return false;
  }

  const maxAge = days * 24 * 60 * 60;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax${
    isSecure ? ';Secure' : ''
  }`;
  return true;
}

/**
 * Client-side reader for current consent record.
 */
export function getClientConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE_NAME}=([^;]*)`));
  const val = match ? decodeURIComponent(match[1]) : null;
  return parseConsentRecord(val);
}

/**
 * Client-side helper to record consent and update lp_consent cookie.
 */
export function saveClientConsent(categories: { preferences: boolean; analytics: boolean }): ConsentRecord {
  const gpc = isGpcSignalEnabled();
  const record: ConsentRecord = {
    version: COOKIE_POLICY_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      strictly_necessary: true,
      preferences: gpc ? false : categories.preferences,
      analytics: false, // Analytics currently un-instrumented placeholder
    },
    gpcApplied: gpc,
  };

  if (typeof document !== 'undefined') {
    const maxAge = 180 * 24 * 60 * 60;
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(record)
    )};path=/;max-age=${maxAge};SameSite=Lax${isSecure ? ';Secure' : ''}`;

    // If preferences consent was revoked or rejected, immediately delete all non-essential cookies
    if (!record.categories.preferences) {
      deleteNonEssentialCookies();
    }
  }

  return record;
}

/**
 * Deletes all non-essential cookies from browser.
 */
export function deleteNonEssentialCookies(): void {
  if (typeof document === 'undefined') return;

  const isSecure = window.location.protocol === 'https:';
  for (const cookieName of NON_ESSENTIAL_COOKIE_NAMES) {
    document.cookie = `${cookieName}=;path=/;max-age=0;SameSite=Lax${isSecure ? ';Secure' : ''}`;
  }

  // Also clean any non-essential localStorage items if preferences consent was rejected
  try {
    localStorage.removeItem('lp_theme');
    localStorage.removeItem('learning_partner_lang');
    localStorage.removeItem('lp_layout');
  } catch {
    // Ignore storage errors
  }
}

