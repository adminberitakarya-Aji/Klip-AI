import * as Sentry from "@sentry/nextjs";
import { env } from "./index";

export function initSentry(
  options: {
    dsn?: string;
    environment?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
    debug?: boolean;
  } = {},
): void {
  const dsn = options.dsn || env.SENTRY_DSN;

  if (!dsn) {
    console.warn("[Sentry] No DSN provided, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn,
    environment: options.environment || env.NODE_ENV || "development",
    tracesSampleRate:
      options.tracesSampleRate ?? (env.NODE_ENV === "production" ? 0.1 : 1.0),
    profilesSampleRate:
      options.profilesSampleRate ?? (env.NODE_ENV === "production" ? 0.1 : 1.0),
    debug: options.debug ?? env.NODE_ENV === "development",

    // Set release version
    release: process.env.npm_package_version || "0.0.0",

    // Custom tags
    initialScope: {
      tags: {
        component: "klip-ai",
        service: options.environment === "api" ? "api" : "web",
      },
    },

    // Filter sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        const sensitiveHeaders = ["authorization", "cookie", "x-api-key"];
        for (const header of sensitiveHeaders) {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[Filtered]";
          }
        }
      }

      // Remove sensitive data from extra
      if (event.extra) {
        const sensitiveKeys = ["password", "token", "secret", "key", "auth"];
        for (const key of Object.keys(event.extra)) {
          if (
            sensitiveKeys.some((sensitive) =>
              key.toLowerCase().includes(sensitive),
            )
          ) {
            event.extra[key] = "[Filtered]";
          }
        }
      }

      return event;
    },
  });
}

export { Sentry };
