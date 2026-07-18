import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { logger } from "@klipai/core/logger";

// apps/web and apps/api run on different ports (different origins), but
// apps/api's session check (see src/lib/session.ts) reads the session cookie
// that apps/web's NextAuth sets. For the browser to send that cookie and for
// the response to be readable by apps/web's fetch calls, this app needs to
// explicitly allow the web app's origin with credentials.
const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  // Add request ID to headers for tracing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Set Sentry context for the request
  Sentry.setContext("request", {
    method: request.method,
    url: request.url,
    pathname: request.nextUrl.pathname,
    requestId,
    userId: request.headers.get("x-user-id") || undefined,
    ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
  });

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  // Create response with CORS headers
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }

  // Add request ID to response
  response.headers.set("x-request-id", requestId);

  // Log API request
  const userId = request.headers.get("x-user-id") || undefined;
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  logger.api.request(request.method, request.nextUrl.pathname, userId, ip);

  // Log response after it's sent (using response headers)
  // Note: duration here is only middleware processing time, not full request
  const durationMs = Date.now() - startTime;
  response.headers.set("x-response-time", `${durationMs}ms`);

  return response;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export const config = {
  matcher: "/api/:path*",
};
