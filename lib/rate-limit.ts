// In-memory fixed-window rate limiter.
//
// State lives in this process only. The app runs a single replica today, so an
// in-memory limiter is sufficient. Scaling beyond one replica requires moving
// this to a shared store (e.g. Redis), otherwise each replica keeps its own
// counters and the effective limit multiplies by the replica count.

type WindowState = { count: number; resetAt: number };

const buckets = new Map<string, WindowState>();
const MAX_BUCKETS = 10_000;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function sweepExpired(now: number) {
  for (const [key, state] of buckets) {
    if (state.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup so abandoned keys (e.g. one-off users) don't pile up.
  if (buckets.size > MAX_BUCKETS) sweepExpired(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfterSeconds: 0,
  };
}
