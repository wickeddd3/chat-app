/**
 * A per-socket token-bucket rate limiter for inbound WebSocket events. Each
 * socket refills at `refillPerSec` up to `capacity`, absorbing short bursts
 * (typing, a flurry of sends) while capping sustained flooding.
 */
export interface TokenBucket {
  tokens: number;
  last: number;
}

export interface RateLimitConfig {
  capacity: number;
  refillPerSec: number;
}

// Generous for a real client (heartbeat + typing + sends) yet caps abuse.
export const DEFAULT_WS_RATE_LIMIT: RateLimitConfig = { capacity: 30, refillPerSec: 15 };

/** Creates a full bucket. */
export function newBucket(config: RateLimitConfig = DEFAULT_WS_RATE_LIMIT, now: number = Date.now()): TokenBucket {
  return { tokens: config.capacity, last: now };
}

/**
 * Refills based on elapsed time and attempts to consume one token. Mutates the
 * bucket. Returns true if the event is allowed, false if rate-limited.
 */
export function tryConsume(
  bucket: TokenBucket,
  config: RateLimitConfig = DEFAULT_WS_RATE_LIMIT,
  now: number = Date.now(),
): boolean {
  const elapsedSeconds = Math.max(0, (now - bucket.last) / 1000);
  bucket.tokens = Math.min(config.capacity, bucket.tokens + elapsedSeconds * config.refillPerSec);
  bucket.last = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}
