import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// apps/api does NOT run its own NextAuth instance (no adapter, no providers,
// no [...nextauth] route here). All sign-in/sign-up happens in apps/web,
// which is where NEXTAUTH_URL and the /signin, /signup pages live.
//
// This app only needs to know "who is making this request", which it gets by
// verifying the JWT that apps/web's NextAuth issued, using the SAME
// NEXTAUTH_SECRET. Set the identical NEXTAUTH_SECRET value in both apps'
// .env files, or this verification will always fail.

export interface SessionUser {
  id: string;
  email?: string | null;
  role: string;
  subscription: string;
}

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'NEXTAUTH_SECRET is not set for apps/api. It must be set to the exact same value as NEXTAUTH_SECRET in apps/web/.env.'
    );
  }

  const token = await getToken({ req: request, secret });
  if (!token || typeof token.id !== 'string' || !token.id) {
    return null;
  }

  return {
    id: token.id,
    email: typeof token.email === 'string' ? token.email : null,
    role: typeof token.role === 'string' ? token.role : 'USER',
    subscription: typeof token.subscription === 'string' ? token.subscription : 'FREE',
  };
}