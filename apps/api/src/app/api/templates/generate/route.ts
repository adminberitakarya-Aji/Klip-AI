import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import {
  templateGenerateSchema,
  type TemplateGenerateInput,
} from "@klipai/core/schemas/template";
import { templateOrchestrator } from "@klipai/ai";
import { z } from "zod";
import { captureError } from "@/lib/error-capture";

type TransactionClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Fire-and-forget execution of template generation.
 * Runs asynchronously after the response is sent to the user.
 * On total failure, refunds credits and marks job as FAILED.
 */
async function executeTemplateGeneration(
  jobId: string,
  templateId: string,
  userId: string,
  brandKitId: string | undefined,
  customizations: TemplateGenerateInput["customizations"],
  creditsCost: number,
) {
  try {
    await templateOrchestrator.generateFromTemplate({
      templateId,
      userId,
      brandKitId,
      customizations,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Template generation failed";
    captureError("Template generation background job failed", error, {
      jobId,
      templateId,
      userId,
    });

    // Mark job as FAILED so user doesn't wait forever
    try {
      await prisma.templateGenerationJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: message,
          updatedAt: new Date(),
        },
      });
    } catch (updateError) {
      captureError("Failed to update job status to FAILED", updateError, {
        jobId,
      });
    }

    // Refund credits since generation never completed
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: creditsCost } },
      });
    } catch (refundError) {
      captureError(
        "Failed to refund credits after failed generation",
        refundError,
        { jobId, userId },
      );
    }
  }
}

// POST /api/templates/generate - Start template generation job
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const input = templateGenerateSchema.parse(body) as TemplateGenerateInput;

    // Get template with shots
    const template = await prisma.storyboardTemplate.findUnique({
      where: { id: input.templateId },
      include: {
        shots: { orderBy: { index: "asc" } },
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Template not found" },
        },
        { status: 404 },
      );
    }

    if (!template.isPublished) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Template is not published" },
        },
        { status: 403 },
      );
    }

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "User not found" },
        },
        { status: 404 },
      );
    }

    const creditsCost = template.creditsCost;
    if (user.credits < creditsCost) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INSUFFICIENT_CREDITS",
            message: `Need ${creditsCost} credits, you have ${user.credits}`,
          },
        },
        { status: 402 },
      );
    }

    // Validate brand kit if provided
    let brandKit = null;
    if (input.brandKitId) {
      brandKit = await prisma.brandKit.findUnique({
        where: { id: input.brandKitId, userId: sessionUser.id },
      });
      if (!brandKit) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Brand kit not found" },
          },
          { status: 404 },
        );
      }
    }

    // Create job + deduct credits atomically. The conditional `where`
    // clause (credits: { gte: creditsCost }) means the decrement only
    // succeeds if the balance is still sufficient at commit time, closing
    // the race window where two concurrent requests could both pass the
    // earlier `user.credits < creditsCost` check and both deduct, pushing
    // the balance negative. Mirrors the guard already used in
    // apps/api/src/app/api/generate/[type]/route.ts.
    let job: { id: string; status: string };
    let remainingCredits: number;
    try {
      const result = await prisma.$transaction(
        async (tx: TransactionClient) => {
          const createdJob = await tx.templateGenerationJob.create({
            data: {
              userId: sessionUser.id,
              templateId: template.id,
              brandKitId: input.brandKitId,
              totalShots: template.shotCount,
              status: "QUEUED",
              progress: 0,
              currentShot: 0,
              customizations: input.customizations as any,
              creditsUsed: 0, // Will be updated after successful shots
            },
          });

          const updated = await tx.user.updateMany({
            where: { id: sessionUser.id, credits: { gte: creditsCost } },
            data: { credits: { decrement: creditsCost } },
          });

          if (updated.count === 0) {
            throw new Error("INSUFFICIENT_CREDITS");
          }

          const updatedUser = await tx.user.findUniqueOrThrow({
            where: { id: sessionUser.id },
            select: { credits: true },
          });

          return { job: createdJob, remainingCredits: updatedUser.credits };
        },
      );

      job = result.job;
      remainingCredits = result.remainingCredits;
    } catch (error) {
      if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INSUFFICIENT_CREDITS",
              message: `Need ${creditsCost} credits, you have insufficient balance`,
            },
          },
          { status: 402 },
        );
      }
      throw error;
    }

    // Fire-and-forget: execute generation in background
    // User will poll for job status to see progress/result
    executeTemplateGeneration(
      job.id,
      template.id,
      sessionUser.id,
      input.brandKitId,
      input.customizations,
      creditsCost,
    );

    // Return job ID for polling
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        creditsDeducted: creditsCost,
        remainingCredits,
      },
    });
  } catch (error) {
    captureError("POST /api/templates/generate", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: error.errors[0].message },
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to start generation",
        },
      },
      { status: 500 },
    );
  }
}
