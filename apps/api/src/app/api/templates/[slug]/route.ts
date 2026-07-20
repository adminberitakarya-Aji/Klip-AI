import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@klipai/db/client";
import {
  updateTemplateSchema,
  type UpdateTemplateInput,
  type TemplateShot,
} from "@klipai/core/schemas/template";
import { z } from "zod";
import { captureError } from "@/lib/error-capture";

/**
 * Calculate total credits cost from template shots
 * Uses pricing formula from @klipai/ai pricing.ts
 */
function calculateCreditsFromShots(shots: TemplateShot[]): number {
  const GenerationType = {
    TEXT_TO_VIDEO: "text-to-video",
    IMAGE_TO_VIDEO: "image-to-video",
    VIDEO_TO_VIDEO: "video-to-video",
    TEXT_TO_IMAGE: "text-to-image",
    IMAGE_TO_IMAGE: "image-to-image",
    MOTION_CONTROL: "motion-control",
  } as const;

  const PROVIDER_MULTIPLIERS: Record<string, number> = {
    "text-to-video": 1.0,
    "image-to-video": 1.2,
    "video-to-video": 1.5,
    "text-to-image": 0.5,
    "image-to-image": 0.6,
    "motion-control": 1.1,
  };

  const RESOLUTION_MULTIPLIERS: Record<string, number> = {
    "720p": 1.0,
    "1080p": 1.5,
    "4k": 2.5,
  };

  const BASE_COST_PER_SHOT = 1;
  const RETRY_BUFFER_PERCENTAGE = 0.2;

  let totalCredits = 0;

  for (const shot of shots) {
    const genTypeString =
      GenerationType[shot.generationType as keyof typeof GenerationType] ||
      "text-to-video";
    const generationMultiplier = PROVIDER_MULTIPLIERS[genTypeString] || 1.0;
    const resolutionMultiplier = RESOLUTION_MULTIPLIERS[shot.resolution] || 1.0;
    const perShotCost =
      BASE_COST_PER_SHOT * generationMultiplier * resolutionMultiplier;
    const baseCost = Math.ceil(perShotCost);
    const retryBuffer = Math.ceil(baseCost * RETRY_BUFFER_PERCENTAGE);
    totalCredits += baseCost + retryBuffer;
  }

  return Math.max(1, totalCredits);
}

// Helper: require admin
async function requireAdmin(request: NextRequest) {
  const sessionUser = await getSessionUser(request);
  if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
    return NextResponse.json(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "Admin access required" },
      },
      { status: 403 },
    );
  }
  return sessionUser;
}

// GET /api/templates/[slug] - Get template detail with all shots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
      include: {
        shots: {
          orderBy: { index: "asc" },
        },
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

    // Only published templates accessible to non-admins
    const sessionUser = await getSessionUser(request);
    const isAdmin = sessionUser?.role === "ADMIN";

    if (
      !template.isPublished &&
      !isAdmin &&
      template.authorId !== sessionUser?.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Template not published" },
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    captureError("GET /api/templates/[slug]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch template" },
      },
      { status: 500 },
    );
  }
}

// PATCH /api/templates/[slug] - Update template (ADMIN or author)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
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

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
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

    // Check authorization: admin or author
    const isAdmin = sessionUser.role === "ADMIN";
    if (!isAdmin && template.authorId !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to update this template",
          },
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const input = updateTemplateSchema.parse(body) as UpdateTemplateInput;

    // If slug is being changed, check uniqueness
    if (input.slug && input.slug !== slug) {
      const existing = await prisma.storyboardTemplate.findUnique({
        where: { slug: input.slug },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "Template slug already exists",
            },
          },
          { status: 409 },
        );
      }
    }

    // Calculate credits cost from shots if shots are provided
    let calculatedCreditsCost: number | undefined;
    if (input.shots && Array.isArray(input.shots)) {
      calculatedCreditsCost = calculateCreditsFromShots(
        input.shots as TemplateShot[],
      );
    }

    // Update template
    const updated = await prisma.storyboardTemplate.update({
      where: { slug },
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        category: input.category,
        tags: input.tags,
        industry: input.industry,
        format: input.format,
        style: input.style,
        totalDuration: input.totalDuration,
        aspectRatio: input.aspectRatio,
        shotCount: input.shotCount,
        referenceStyleUrl: input.referenceStyleUrl,
        referenceStyleType: input.referenceStyleType,
        brandKitSlots: input.brandKitSlots,
        // Use auto-calculated credits if shots provided, otherwise use input or keep existing
        creditsCost: calculatedCreditsCost ?? input.creditsCost ?? undefined,
        isPublished: input.isPublished ?? undefined,
        isOfficial: isAdmin ? input.isOfficial : undefined, // Only admin can change isOfficial
        version: input.version ? { increment: 1 } : undefined,
      },
      include: {
        shots: { orderBy: { index: "asc" } },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    captureError("PATCH /api/templates/[slug]", error);

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
        error: { code: "INTERNAL_ERROR", message: "Failed to update template" },
      },
      { status: 500 },
    );
  }
}

// DELETE /api/templates/[slug] - Delete template (ADMIN or author)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
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

    const template = await prisma.storyboardTemplate.findUnique({
      where: { slug },
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

    // Check authorization: admin or author
    const isAdmin = sessionUser.role === "ADMIN";
    if (!isAdmin && template.authorId !== sessionUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Not authorized to delete this template",
          },
        },
        { status: 403 },
      );
    }

    // Soft delete: unpublish instead of hard delete (preserve history)
    await prisma.storyboardTemplate.update({
      where: { slug },
      data: { isPublished: false },
    });

    return NextResponse.json({
      success: true,
      message: "Template unpublished",
    });
  } catch (error) {
    captureError("DELETE /api/templates/[slug]", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete template" },
      },
      { status: 500 },
    );
  }
}
