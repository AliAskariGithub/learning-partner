import { cookies, headers } from 'next/headers';
import {
  COOKIE_POLICY_VERSION,
  ConsentRecord,
  NON_ESSENTIAL_COOKIE_NAMES,
} from '@/config/cookies';
import { CONSENT_COOKIE_NAME, parseConsentRecord } from './consent';

/**
 * Server-Side Consent Reader.
 * Inspects lp_consent cookie and Sec-GPC header.
 */
export async function getServerConsent(): Promise<ConsentRecord | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONSENT_COOKIE_NAME)?.value;
  const parsed = parseConsentRecord(raw);

  const reqHeaders = await headers();
  const secGpc = reqHeaders.get('sec-gpc');

  if (!parsed) {
    // If no prior consent and GPC header is "1", default to reject non-essential
    if (secGpc === '1') {
      return {
        version: COOKIE_POLICY_VERSION,
        timestamp: new Date().toISOString(),
        categories: {
          strictly_necessary: true,
          preferences: false,
          analytics: false,
        },
        gpcApplied: true,
      };
    }
    return null;
  }

  // If user has GPC active, override preferences to false
  if (secGpc === '1') {
    return {
      ...parsed,
      categories: {
        ...parsed.categories,
        preferences: false,
      },
      gpcApplied: true,
    };
  }

  return parsed;
}

/**
 * Server-Side Preference Cookie Setter.
 * Only writes the cookie if the preferences category is explicitly consented.
 */
export async function setServerPreferenceCookie(
  name: string,
  value: string,
  days = 180
): Promise<boolean> {
  const consent = await getServerConsent();
  if (!consent?.categories.preferences) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    path: '/',
    maxAge: days * 24 * 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });
  return true;
}

/**
 * Server-Side non-essential cookie cleaner.
 */
export async function deleteServerNonEssentialCookies(): Promise<void> {
  const cookieStore = await cookies();
  for (const c of NON_ESSENTIAL_COOKIE_NAMES) {
    cookieStore.delete(c);
  }
}

