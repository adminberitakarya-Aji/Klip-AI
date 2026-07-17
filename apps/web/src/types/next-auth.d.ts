import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscription: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    subscription: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    subscription: string;
  }
}