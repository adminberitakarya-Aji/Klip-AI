/**
 * Sliding-window rate limiter.
 *
 * IMPORTANT: this is in-memory, so it only works correctly within a
 * single running server process. If Klip-AI is ever deployed across
 * multiple instances/serverless functions (e.g. Vercel with multiple
 * concurrent lambdas), each instance gets its own counters and the
 * effective limit becomes (limit * instance count). Fine for a single
 * self-hosted Next.js server; swap RateLimitStore's internals for a
 * Redis-backed implementation (see plan 10.4) before scaling out.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
}

class InMemoryRateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly windowMs: number,
    private readonly max: number,
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const timestamps = (this.hits.get(key) || []).filter(
      (t) => t > windowStart,
    );

    const allowed = timestamps.length < this.max;
    if (allowed) {
      timestamps.push(now);
    }
    this.hits.set(key, timestamps);

    // Periodic cleanup so the map doesn't grow unbounded with
    // one-off IPs/users that never come back.
    if (this.hits.size > 10000) {
      for (const [k, v] of this.hits) {
        if (v.every((t) => t <= windowStart)) this.hits.delete(k);
      }
    }

    return {
      allowed,
      limit: this.max,
      remaining: Math.max(0, this.max - timestamps.length),
      resetAt:
        timestamps.length > 0
          ? timestamps[0] + this.windowMs
          : now + this.windowMs,
    };
  }
}

// Generation is the expensive/abusable action (calls Claude + a paid
// video provider), so it gets its own, tighter limits than a generic
// API-wide limiter would.
export const perUserGenerateLimiter = new InMemoryRateLimiter(
  60_000, // 1 minute window
  10, // 10 generation requests/min per user
);

export const perIpGenerateLimiter = new InMemoryRateLimiter(
  60_000,
  30, // 30/min per IP — covers several users behind one office/warnet IP
);

/**
 * Best-effort client IP extraction for Next.js on a standard Node
 * server (no built-in request.ip outside Vercel's edge runtime).
 * Trusts x-forwarded-for, so this MUST run behind a reverse proxy
 * that sets/overwrites that header — otherwise it's spoofable.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

export function rateLimitResponseHeaders(
  result: RateLimitResult,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(!result.allowed
      ? {
          "Retry-After": String(
            Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)),
          ),
        }
      : {}),
  };
}
