/**
 * Distributed rate limiter using Upstash Redis.
 *
 * Replaces in-memory rate limiter for multi-instance/serverless deployments.
 * Works with Supabase Edge Functions, Vercel, etc.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Upstash is configured
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const isUpstashConfigured = Boolean(upstashUrl && upstashToken);

// Upstash Redis client (only initialized if env vars are set)
const redis = isUpstashConfigured
  ? new Redis({
      url: upstashUrl!,
      token: upstashToken!,
    })
  : null;

// Fallback to in-memory if Upstash not configured
let useInMemoryFallback = !isUpstashConfigured;

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
  isDistributed: boolean;
}

// In-memory fallback for development/testing
class InMemoryFallback {
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

    // Periodic cleanup
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
      isDistributed: false,
    };
  }
}

// Upstash ratelimit instances
const upstashUserLimiter =
  isUpstashConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute per user
        analytics: true,
        prefix: "klip:ratelimit:user",
      })
    : null;

const upstashIpLimiter =
  isUpstashConfigured && redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute per IP
        analytics: true,
        prefix: "klip:ratelimit:ip",
      })
    : null;

// In-memory fallback instances
const inMemoryUserLimiter = new InMemoryFallback(60_000, 10);
const inMemoryIpLimiter = new InMemoryFallback(60_000, 30);

export async function checkUserRateLimit(
  userId: string,
): Promise<RateLimitResult> {
  if (useInMemoryFallback || !upstashUserLimiter) {
    return inMemoryUserLimiter.check(`user:${userId}`);
  }

  try {
    const result = await upstashUserLimiter.limit(`user:${userId}`);
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
      isDistributed: true,
    };
  } catch (error) {
    console.error(
      "Upstash rate limit error, falling back to in-memory:",
      error,
    );
    useInMemoryFallback = true;
    return inMemoryUserLimiter.check(`user:${userId}`);
  }
}

export async function checkIpRateLimit(ip: string): Promise<RateLimitResult> {
  if (useInMemoryFallback || !upstashIpLimiter) {
    return inMemoryIpLimiter.check(`ip:${ip}`);
  }

  try {
    const result = await upstashIpLimiter.limit(`ip:${ip}`);
    return {
      allowed: result.success,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset,
      isDistributed: true,
    };
  } catch (error) {
    console.error(
      "Upstash rate limit error, falling back to in-memory:",
      error,
    );
    useInMemoryFallback = true;
    return inMemoryIpLimiter.check(`ip:${ip}`);
  }
}

export function isDistributedRateLimitEnabled(): boolean {
  return Boolean(isUpstashConfigured && !useInMemoryFallback);
}
