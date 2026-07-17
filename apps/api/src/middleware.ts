import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// apps/web and apps/api run on different ports (different origins), but
// apps/api's session check (see src/lib/session.ts) reads the session cookie
// that apps/web's NextAuth sets. For the browser to send that cookie and for
// the response to be readable by apps/web's fetch calls, this app needs to
// explicitly allow the web app's origin with credentials.
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function middleware(request: NextRequest) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(corsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export const config = {
  matcher: '/api/:path*',
};