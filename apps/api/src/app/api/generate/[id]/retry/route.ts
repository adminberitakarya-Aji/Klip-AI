import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  perUserGenerateLimiter,
  rateLimitResponseHeaders,
} from "@/lib/rate-limit";
import { generationService } from "@klipai/ai/services/generation-service";
import { prisma } from "@klipai/db/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const sessionUser = await getSessionUser(request);
    if (!sessionUser?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 },
      );
    }

    // Retrying re-runs the same expensive pipeline, so it counts
    // against the same per-user limit as a fresh generation request.
    const userLimit = perUserGenerateLimiter.check(sessionUser.id);
    if (!userLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Too many generation requests. Please slow down.",
          },
        },
        { status: 429, headers: rateLimitResponseHeaders(userLimit) },
      );
    }

    const generation = await prisma.generation.findUnique({ where: { id } });
    if (!generation || generation.userId !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Generation not found" },
        },
        { status: 404 },
      );
    }

    const result = await generationService.retryFailedGeneration(id);

    if (!result.retried) {
      const status = result.reason === "NOT_FOUND" ? 404 : 409;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.reason || "RETRY_FAILED",
            message:
              result.reason === "MAX_RETRIES_EXCEEDED"
                ? "This generation has already been retried the maximum number of times."
                : result.reason === "NOT_FAILED"
                  ? "Only failed generations can be retried."
                  : "Generation not found.",
          },
        },
        { status },
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, status: "QUEUED", progress: 0 },
    });
  } catch (error) {
    console.error(`Retry error for ${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retry generation",
        },
      },
      { status: 500 },
    );
  }
}
