import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
// @auth/prisma-adapter is declared in deps but may not be symlinked in all
// environments — load it lazily so type-check and runtime both succeed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _adapter: any = null;
export async function getAdapter(): Promise<Adapter | undefined> {
  if (_adapter !== null) return _adapter;
  try {
    const mod = await import("@auth/prisma-adapter");
    _adapter = mod.PrismaAdapter;
  } catch {
    _adapter = undefined;
  }
  return _adapter;
}
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "@klipai/db/client";
import { compare } from "bcryptjs";
import type { NextAuthConfig } from "next-auth";

// Explicit return type alias to work around pnpm hoisting producing two
// copies of @auth/core types (next-auth + @auth/prisma-adapter). The inferred
// type chain references a private path which TypeScript can't make portable.
type NextAuthReturn = {
  handlers: {
    GET: (req: Request) => Promise<Response>;
    POST: (req: Request) => Promise<Response>;
  };
  auth: (req?: Request) => Promise<{
    user?: {
      id?: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  } | null>;
  signIn: (
    provider?: string,
    options?: Record<string, unknown>,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
};

// NOTE: This is the ONLY place NextAuth is configured. apps/api does not run
// its own NextAuth instance - it verifies the JWT this app issues (see
// apps/api/src/lib/session.ts). Both apps must share the same
// NEXTAUTH_SECRET value in their respective .env files.
export const authOptions: NextAuthConfig = {
  // adapter is set at runtime via getAdapter() (see handler below).
  // Required only for OAuth account linking; we use JWT sessions.
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase() },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        const isValid = await compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          credits: user.credits,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        token.id = (u.id as string) ?? "";
        token.role = (u.role as string) ?? "";
        token.credits = (u.credits as number) ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = token.id;
        su.role = token.role;
        su.credits = token.credits;
      }
      return session;
    },
  },
};

const { handlers, auth, signIn, signOut } = NextAuth(
  authOptions,
) as unknown as NextAuthReturn;

export { handlers, auth, signIn, signOut };
