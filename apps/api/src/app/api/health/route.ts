import { NextResponse } from "next/server";
import { prisma } from "@klipai/db/client";
// Importing generationService (even though unused directly) triggers
// its module-level singleton construction, which calls
// initializeProviders() — this guarantees providerRouter has the
// configured providers registered even if this is the very first
// route hit in this server process (e.g. right after cold start,
// before /api/generate has ever been called).
import {
  providerRouter,
  generationService,
} from "@klipai/ai/services/generation-service";

export const dynamic = "force-dynamic";

interface CheckResult {
  status: "ok" | "error";
  latencyMs?: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown DB error",
    };
  }
}

export async function GET() {
  void generationService; // ensure providers are initialized, see import comment above

  const startedAt = Date.now();
  const database = await checkDatabase();
  const providers = providerRouter.getHealth();

  const registeredProviders = Object.entries(providers).filter(
    ([, p]) => p.registered,
  );
  const availableProviders = registeredProviders.filter(
    ([, p]) => !p.circuitOpen,
  );

  // Healthy requires: DB reachable, at least one provider configured,
  // and at least one of those configured providers not currently
  // tripped by the circuit breaker.
  const healthy =
    database.status === "ok" &&
    registeredProviders.length > 0 &&
    availableProviders.length > 0;

  const body = {
    status: healthy ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    checks: {
      database,
      providers,
    },
  };

  return NextResponse.json(body, { status: healthy ? 200 : 503 });
}
