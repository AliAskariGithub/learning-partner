import crypto from 'crypto';
import { siteConfig } from '@/config/site';

export interface SpamCheckParams {
  honeypotValue?: string;
  formLoadedAt?: number | string;
  turnstileToken?: string;
  clientIp?: string;
}

export interface SpamCheckResult {
  allowed: boolean;
  reason?: string;
}

// In-memory sliding window rate limiter for submissions (fallback & fast path)
const submissionWindows = new Map<string, number[]>();

/**
 * Generates an encrypted/salted SHA-256 hash of an IP address.
 * Raw IP addresses are NEVER stored in the database or written to logs.
 */
export function hashIpAddress(rawIp: string | null | undefined): string {
  if (!rawIp || rawIp.trim() === '') {
    return '0'.repeat(64);
  }
  const salt = process.env.IP_HASH_SALT || 'lp-production-salted-ip-hash-2026';
  return crypto.createHash('sha256').update(`${rawIp.trim()}:${salt}`).digest('hex');
}

/**
 * Validates a submission against automated bot indicators:
 * 1. Honeypot check (field must be strictly empty)
 * 2. Time-to-submit check (minimum 3 seconds required for human interaction)
 * 3. Rate limiting (max 5 requests per 10 minutes per IP hash)
 * 4. Optional Cloudflare Turnstile verification
 */
export async function verifySpamProtection(
  params: SpamCheckParams
): Promise<SpamCheckResult> {
  const { honeypotValue, formLoadedAt, turnstileToken, clientIp } = params;

  // 1. Honeypot check
  if (honeypotValue && honeypotValue.trim() !== '') {
    return {
      allowed: false,
      reason: 'Automated submission detected (honeypot triggered).',
    };
  }

  // 2. Minimum time-to-submit check (minimum 3,000 ms)
  if (formLoadedAt) {
    const loadedAtNum = typeof formLoadedAt === 'string' ? parseInt(formLoadedAt, 10) : formLoadedAt;
    if (!isNaN(loadedAtNum)) {
      const elapsed = Date.now() - loadedAtNum;
      if (elapsed < 3000) {
        return {
          allowed: false,
          reason: 'Form submitted unnaturally quickly. Please take a moment and try again.',
        };
      }
    }
  }

  // 3. Rate Limiter (Max 5 submissions per 10 minutes per IP hash)
  const ipHash = hashIpAddress(clientIp);
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxAttempts = 5;

  const timestamps = (submissionWindows.get(ipHash) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxAttempts) {
    return {
      allowed: false,
      reason: 'Too many submissions from this connection. Please wait 10 minutes before trying again.',
    };
  }
  timestamps.push(now);
  submissionWindows.set(ipHash, timestamps);

  // 4. Optional Cloudflare Turnstile verification
  if (
    siteConfig.features.turnstileEnabled &&
    process.env.TURNSTILE_SECRET_KEY &&
    turnstileToken
  ) {
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: clientIp || '',
        }),
      });

      const outcome = (await response.json()) as { success: boolean; 'error-codes'?: string[] };
      if (!outcome.success) {
        return {
          allowed: false,
          reason: 'Security verification failed. Please refresh the page and try again.',
        };
      }
    } catch {
      // If external verification network fails, fallback gracefully so users aren't locked out
    }
  }

  return { allowed: true };
}

