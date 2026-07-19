import * as Sentry from "@sentry/nextjs";
import { logger } from "@klipai/core/logger";

/**
 * Capture error to Sentry + structured log.
 * Use this instead of console.error in route handlers.
 */
export function captureError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  // Capture to Sentry with context
  Sentry.captureException(err, {
    extra: {
      context,
      ...extra,
    },
  });

  // Also log structured
  logger.error(`[${context}] ${err.message}`, {
    context,
    error: err.message,
    stack: err.stack,
    ...extra,
  });
}

/**
 * Convenience wrapper for async route handlers.
 * Catches errors and sends to Sentry + logger.
 */
export async function withErrorCapture<T>(
  context: string,
  fn: () => Promise<T>,
  extra?: Record<string, unknown>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(context, error, extra);
    throw error;
  }
}
