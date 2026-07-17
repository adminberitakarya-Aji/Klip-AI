// Module declaration for @auth/prisma-adapter.
// The package is declared in apps/web/package.json but may not be symlinked
// in all workspace setups. The runtime uses a dynamic import wrapped in
// try/catch in src/lib/auth.ts. This declaration tells TypeScript the module
// exists and what its default export looks like.
declare module "@auth/prisma-adapter" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const PrismaAdapter: (client: any) => any;
}
