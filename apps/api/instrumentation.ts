export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node.js runtime - server-side instrumentation
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime - edge middleware instrumentation
    await import("./sentry.edge.config");
  }
}
