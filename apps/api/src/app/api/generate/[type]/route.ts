import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import {
  perUserGenerateLimiter,
  perIpGenerateLimiter,
  getClientIp,
  rateLimitResponseHeaders,
} from "@/lib/rate-limit";
import { generationService } from "@klipai/ai/services/generation-service";
import { generationRequestSchema } from "@klipai/core/schemas";
import { prisma } from "@klipai/db/client";
import { GenerationType } from "@klipai/core/types";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const VALID_TYPES: GenerationType[] = [
  GenerationType.TEXT_TO_VIDEO,
  GenerationType.IMAGE_TO_VIDEO,
  GenerationType.VIDEO_TO_VIDEO,
  GenerationType.TEXT_TO_IMAGE,
  GenerationType.IMAGE_TO_IMAGE,
  GenerationType.MOTION_CONTROL,
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  if (!VALID_TYPES.includes(type as GenerationType)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_TYPE", message: "Invalid generation type" },
      },
      { status: 400 },
    );
  }

  try {
    const ip = getClientIp(request);
    const ipLimit = perIpGenerateLimiter.check(ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message:
              "Too many generation requests from this network. Try again shortly.",
          },
        },
        { status: 429, headers: rateLimitResponseHeaders(ipLimit) },
      );
    }

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

    const body = await request.json();
    const parsed = generationRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: parsed.error.message },
        },
        { status: 400 },
      );
    }

    // Atomic credit check, decrement, and generation creation in a single transaction
    const result = await prisma.$transaction(async (tx: TransactionClient) => {
      // Check and decrement credits atomically
      const updatedUser = await tx.user.update({
        where: { id: sessionUser.id, credits: { gt: 0 } },
        data: { credits: { decrement: 1 } },
        select: { credits: true },
      });

      if (!updatedUser) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      // Create generation record
      const generation = await tx.generation.create({
        data: {
          userId: sessionUser.id,
          prompt: parsed.data.prompt,
          type: (type as GenerationType)
            .toUpperCase()
            .replace(/-/g, "_") as any,
          status: "QUEUED",
          options: parsed.data.options as any,
          images: parsed.data.images || [],
          video: parsed.data.video || null,
        },
      });

      return { generationId: generation.id, credits: updatedUser.credits };
    });

    // Queue for async processing using the generation that was already created in the transaction
    generationService
      .processGeneration(result.generationId, {
        brief: parsed.data.prompt,
        type: type as GenerationType,
        images: parsed.data.images,
        video: parsed.data.video,
        userPreferences: parsed.data.options as any,
      })
      .catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        id: result.generationId,
        status: "QUEUED",
        progress: 0,
        createdAt: Date.now(),
      },
    });
  } catch (error) {
    console.error(`${type} error:`, error);

    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: "Not enough credits",
          },
        },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Generation failed" },
      },
      { status: 500 },
    );
  }
}
