/**
 * Simple in-memory sliding window rate limiter for user requests.
 */
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < 60000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 30000);

export function checkRateLimit(
  userId: string,
  limit = 30,
  windowMs = 60000
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  let record = rateLimitStore.get(userId);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(userId, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
  };
}

