import { newBucket, tryConsume, type RateLimitConfig } from "@/web-socket/rate-limit";

const config: RateLimitConfig = { capacity: 3, refillPerSec: 1 };

describe("WebSocket token-bucket rate limiter", () => {
  it("starts full and allows up to `capacity` immediate events", () => {
    const bucket = newBucket(config, 0);
    expect(tryConsume(bucket, config, 0)).toBe(true);
    expect(tryConsume(bucket, config, 0)).toBe(true);
    expect(tryConsume(bucket, config, 0)).toBe(true);
    // Fourth in the same instant is over budget.
    expect(tryConsume(bucket, config, 0)).toBe(false);
  });

  it("refills over time at `refillPerSec`", () => {
    const bucket = newBucket(config, 0);
    // Drain the bucket.
    tryConsume(bucket, config, 0);
    tryConsume(bucket, config, 0);
    tryConsume(bucket, config, 0);
    expect(tryConsume(bucket, config, 0)).toBe(false);

    // 1 second later → 1 token refilled → one event allowed, then blocked again.
    expect(tryConsume(bucket, config, 1000)).toBe(true);
    expect(tryConsume(bucket, config, 1000)).toBe(false);
  });

  it("never refills beyond capacity", () => {
    const bucket = newBucket(config, 0);
    tryConsume(bucket, config, 0); // 2 left
    // A long idle period should cap at capacity, not overflow.
    expect(tryConsume(bucket, config, 10_000)).toBe(true);
    expect(bucket.tokens).toBeLessThanOrEqual(config.capacity);
  });
});
