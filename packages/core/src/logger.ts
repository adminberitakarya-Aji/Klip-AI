import pino, { Logger, LoggerOptions } from "pino";
import { env } from "@klipai/config";

let loggerInstance: Logger | null = null;

function createLogger(): Logger {
  const isProduction = env.NODE_ENV === "production";
  const isTest = env.NODE_ENV === "test";

  const options: LoggerOptions = {
    level: env.LOG_LEVEL || (isProduction ? "info" : "debug"),
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: [
        "*.password",
        "*.passwordHash",
        "*.secret",
        "*.token",
        "*.apiKey",
        "*.authorization",
        "req.headers.authorization",
        "req.headers.cookie",
      ],
      censor: "[REDACTED]",
    },
  };

  if (!isProduction && !isTest) {
    // Development: pretty print
    return pino({
      ...options,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    });
  }

  // Production: JSON output
  return pino(options);
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}

// Convenience methods for structured logging
export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    getLogger().debug(meta, message),
  info: (message: string, meta?: Record<string, unknown>) =>
    getLogger().info(meta, message),
  warn: (message: string, meta?: Record<string, unknown>) =>
    getLogger().warn(meta, message),
  error: (message: string, meta?: Record<string, unknown>) =>
    getLogger().error(meta, message),
  fatal: (message: string, meta?: Record<string, unknown>) =>
    getLogger().fatal(meta, message),

  // Structured logging helpers
  generation: {
    started: (generationId: string, type: string, userId: string) =>
      getLogger().info(
        { generationId, type, userId, event: "generation_started" },
        "Generation started",
      ),
    completed: (generationId: string, type: string, durationMs: number) =>
      getLogger().info(
        { generationId, type, durationMs, event: "generation_completed" },
        "Generation completed",
      ),
    failed: (generationId: string, type: string, error: Error) =>
      getLogger().error(
        {
          generationId,
          type,
          error: error.message,
          stack: error.stack,
          event: "generation_failed",
        },
        "Generation failed",
      ),
    retried: (generationId: string, attempt: number, error: Error) =>
      getLogger().warn(
        {
          generationId,
          attempt,
          error: error.message,
          event: "generation_retried",
        },
        "Generation retry attempt",
      ),
  },

  provider: {
    request: (provider: string, type: string, requestId: string) =>
      getLogger().info(
        { provider, type, requestId, event: "provider_request" },
        "Provider request sent",
      ),
    response: (
      provider: string,
      type: string,
      requestId: string,
      durationMs: number,
    ) =>
      getLogger().info(
        { provider, type, requestId, durationMs, event: "provider_response" },
        "Provider response received",
      ),
    error: (provider: string, type: string, requestId: string, error: Error) =>
      getLogger().error(
        {
          provider,
          type,
          requestId,
          error: error.message,
          stack: error.stack,
          event: "provider_error",
        },
        "Provider error",
      ),
    fallback: (fromProvider: string, toProvider: string, reason: string) =>
      getLogger().warn(
        { fromProvider, toProvider, reason, event: "provider_fallback" },
        "Provider fallback triggered",
      ),
    circuitBreaker: (
      provider: string,
      state: "open" | "half-open" | "closed",
    ) =>
      getLogger().warn(
        { provider, circuitState: state, event: "circuit_breaker" },
        `Circuit breaker ${state}`,
      ),
  },

  auth: {
    login: (userId: string, method: string) =>
      getLogger().info({ userId, method, event: "auth_login" }, "User login"),
    logout: (userId: string) =>
      getLogger().info({ userId, event: "auth_logout" }, "User logout"),
    failed: (email: string, reason: string) =>
      getLogger().warn({ email, reason, event: "auth_failed" }, "Auth failed"),
  },

  api: {
    request: (method: string, path: string, userId?: string, ip?: string) =>
      getLogger().info(
        { method, path, userId, ip, event: "api_request" },
        "API request",
      ),
    response: (
      method: string,
      path: string,
      statusCode: number,
      durationMs: number,
    ) =>
      getLogger().info(
        { method, path, statusCode, durationMs, event: "api_response" },
        "API response",
      ),
    error: (method: string, path: string, error: Error, userId?: string) =>
      getLogger().error(
        {
          method,
          path,
          userId,
          error: error.message,
          stack: error.stack,
          event: "api_error",
        },
        "API error",
      ),
  },

  db: {
    query: (model: string, operation: string, durationMs: number) =>
      getLogger().debug(
        { model, operation, durationMs, event: "db_query" },
        "DB query",
      ),
    error: (model: string, operation: string, error: Error) =>
      getLogger().error(
        {
          model,
          operation,
          error: error.message,
          stack: error.stack,
          event: "db_error",
        },
        "DB error",
      ),
  },

  storage: {
    upload: (provider: string, key: string, size: number) =>
      getLogger().info(
        { provider, key, size, event: "storage_upload" },
        "File uploaded to storage",
      ),
    download: (provider: string, key: string) =>
      getLogger().info(
        { provider, key, event: "storage_download" },
        "File downloaded from storage",
      ),
    error: (provider: string, key: string, error: Error) =>
      getLogger().error(
        {
          provider,
          key,
          error: error.message,
          stack: error.stack,
          event: "storage_error",
        },
        "Storage error",
      ),
  },
};

export default logger;
