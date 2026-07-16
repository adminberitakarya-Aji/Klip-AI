import 'next-auth';
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscription: string;
    } & DefaultSession['user'];
  }
  
  interface NextAuthResult {
    user?: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
      subscription?: string;
    };
  }
}