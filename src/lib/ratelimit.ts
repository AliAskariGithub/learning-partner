/**
 * In-memory rate limiter for user requests.
 * Configured to allow all requests without blocking (rate limit removed per user requirement).
 */
export function checkRateLimit(
  _userId: string,
  _limit = 1000,
  _windowMs = 60000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  return {
    allowed: true,
    remaining: 999999,
    retryAfter: 0,
  };
}
