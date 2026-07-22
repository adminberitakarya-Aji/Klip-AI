import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getClientIp, rateLimitResponseHeaders } from "@/lib/rate-limit";
import {
  checkUserRateLimit,
  checkIpRateLimit,
} from "@/lib/distributed-rate-limit";
import { generationService } from "@klipai/ai/services/generation-service";
import { generationRequestSchema } from "@klipai/core/schemas";
import { prisma } from "@klipai/db/client";
import { CreditTransactionType, PaymentStatus } from "@klipai/db";
import { GenerationType } from "@klipai/core/types";
import { captureError } from "@/lib/error-capture";
import { refundCredits } from "@/lib/credits";

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
  // Phase 11.5: Advanced Generation Modes
  GenerationType.VIDEO_TO_VIDEO_STYLE_TRANSFER,
  GenerationType.INPAINTING_OUTPAINTING,
  GenerationType.DEPTH_NORMAL_CONTROL,
  GenerationType.MULTI_SHOT_STORYBOARD,
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
    const ipLimit = await checkIpRateLimit(ip);
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

    const userLimit = await checkUserRateLimit(sessionUser.id);
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

    // Atomic credit check, decrement, generation creation, and transaction record in a single transaction
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

      // Create credit transaction record for the deduction
      const creditTransaction = await tx.creditTransaction.create({
        data: {
          userId: sessionUser.id,
          amount: 1,
          type: CreditTransactionType.USAGE,
          description: `Generation: ${type}`,
          paymentStatus: PaymentStatus.COMPLETED,
        },
      });

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
          // NEW: Store reference images (Phase 11.1)
          referenceImages: parsed.data.referenceImages as any,
          // NEW: Store motion brush config (Phase 11.2)
          motionBrush: (parsed.data as any).motionBrush as any,
          // NEW: Store camera control config (Phase 11.2)
          cameraControl: (parsed.data as any).cameraControl as any,
          // NEW: Store physics config (Phase 11.2)
          physics: (parsed.data as any).physics as any,
          // NEW: Store post-processing pipeline (Phase 11.3)
          postProcessing: (parsed.data as any).postProcessing as any,
          // Store credit transaction ID for potential refund
          metadata: {
            creditTransactionId: creditTransaction.id,
            generationType: type,
          } as any,
        },
      });

      return {
        generationId: generation.id,
        credits: updatedUser.credits,
        creditTransactionId: creditTransaction.id,
      };
    });

    // Queue for async processing using the generation that was already created in the transaction
    // Note: processGeneration runs asynchronously after response is sent
    generationService
      .processGeneration(result.generationId, {
        brief: parsed.data.prompt,
        type: type as GenerationType,
        images: parsed.data.images,
        video: parsed.data.video,
        // NEW: Pass reference images (Phase 11.1)
        referenceImages: parsed.data.referenceImages,
        userPreferences: parsed.data.options as any,
      })
      .catch(async (e) => {
        captureError(`POST /api/generate/${type}`, e, {
          userId: sessionUser?.id,
        });
        // Refund credits when generation fails
        await refundCredits(
          sessionUser.id,
          1,
          result.creditTransactionId,
          `Generation failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      });

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
    captureError(`POST /api/generate/${type}`, error);

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
