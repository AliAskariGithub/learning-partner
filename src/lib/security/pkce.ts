import crypto from 'crypto';

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}

/**
 * Encodes a buffer to base64url without padding.
 */
function base64url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Generates an RFC 7636 compliant PKCE code verifier, S256 code challenge, and state.
 */
export function generatePkcePair(): PkcePair {
  // 32 random bytes -> 43 base64url characters (valid RFC 7636 range is 43-128 chars)
  const randomBytes = crypto.randomBytes(32);
  const codeVerifier = base64url(randomBytes);

  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = base64url(hash);

  const stateBytes = crypto.randomBytes(24);
  const state = base64url(stateBytes);

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state,
  };
}

/**
 * Computes S256 challenge from a verifier.
 */
export function computeS256Challenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64url(hash);
}

/**
 * Validates a state token with timing-safe comparison.
 */
export function validateStateToken(expectedState: string, providedState: string): boolean {
  if (!expectedState || !providedState) return false;
  try {
    const expectedBuf = Buffer.from(expectedState);
    const providedBuf = Buffer.from(providedState);
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

