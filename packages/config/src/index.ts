/// <reference types="node" />

import { z } from 'zod';

/**
 * NOTE ON "REQUIRED" FIELDS:
 * This schema is shared by BOTH apps/web and apps/api, and the two apps need
 * different subsets of these variables (e.g. apps/web doesn't need
 * AI_PROVIDER_API_KEY, apps/api doesn't need NEXTAUTH_URL). Marking a field
 * required here with `.parse()` would throw at import time for *every*
 * consumer, even ones that never touch that field - which previously broke
 * apps/web's build because it transitively imports this package via
 * @klipai/db but doesn't define AI_PROVIDER_API_KEY / NEXTAUTH_SECRET in its
 * own .env.
 *
 * So: every field here stays optional at the schema level, and we use
 * `requireEnv()` below so each app/package can assert - at the specific point
 * where a variable is actually used - exactly which variables IT needs. That
 * gives a clear, targeted error instead of an app-wide crash caused by a var
 * some other app needs.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),

  // Auth
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // AI Providers
  AI_PROVIDER_API_KEY: z.string().min(1).optional(),
  AI_PROVIDER_BASE_URL: z.string().url().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Only format-level checks (e.g. NEXTAUTH_SECRET must be 32+ chars if set,
  // *_URL must be a valid URL if set) can fail here, since nothing is
  // required. Fail loudly either way since it means an env var is malformed.
  console.error('[@klipai/config] Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables. Check the console output above for details.');
}

export const env = parsed.data;

export type Env = z.infer<typeof envSchema>;

/**
 * Assert that a specific set of env vars is present, throwing a clear error
 * naming exactly what's missing. Call this at the point where your
 * app/package actually needs the variable (e.g. inside a Prisma client
 * module, or an AI provider constructor) rather than relying on the shared
 * schema above to enforce it globally.
 *
 * Example: requireEnv(['DATABASE_URL']);
 */
export function requireEnv<K extends keyof Env>(keys: K[]): void {
  const missing = keys.filter((key) => {
    const value = env[key];
    return value === undefined || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      `Check your .env file against .env.example.`
    );
  }
}