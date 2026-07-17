import { z } from 'zod';

const envSchema = z.object({
  // Database - REQUIRED
  DATABASE_URL: z.string().url(),
  
  // Auth - REQUIRED
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // AI Providers - REQUIRED
  AI_PROVIDER_API_KEY: z.string().min(1),
  AI_PROVIDER_BASE_URL: z.string().url().optional(),
  
  // App - REQUIRED
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
