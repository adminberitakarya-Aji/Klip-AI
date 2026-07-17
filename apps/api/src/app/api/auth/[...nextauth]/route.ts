// NOTE: NextAuth ONLY runs in apps/web (port 3000).
// apps/api does NOT host a NextAuth instance. It verifies JWTs issued by
// apps/web via next-auth/jwt in apps/api/src/lib/session.ts.
//
// Do NOT add GET/POST handlers here. If you need to create an auth-related
// endpoint on the API side, use a different route (e.g. /api/auth/verify).
export {};
